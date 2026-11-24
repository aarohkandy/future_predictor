import { experimental_decide } from 'ai';
import { KINDS } from '../oracle.js';

const bad = () => Response.json({ error: 'bad request' }, { status: 400 });

// Counts the bytes actually read, so the limit holds whatever Content-Length claims,
// and gives up after a second so a trickled body can't hold the function open.
async function readCapped(request, max) {
  if (Number(request.headers.get('content-length')) > max) throw new RangeError('body too large');
  const reader = request.body.getReader();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    reader.cancel().catch(() => {});
  }, 1000);
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (timedOut) throw new RangeError('body read timed out'); // never treat a cut-off body as complete
      if (done) return Buffer.concat(chunks).toString('utf8');
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new RangeError('body too large');
      }
      chunks.push(value);
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request) {
  let q;
  try {
    q = JSON.parse(await readCapped(request, 1024))?.q;
  } catch {
    return bad();
  }
  if (typeof q !== 'string') return bad();
  q = q.trim();
  // ponytail: the 200-char cap is the only cost bound on this public endpoint; add rate limiting if abused.
  if (q.length < 1 || q.length > 200) return bad();

  try {
    const { answers } = await experimental_decide({
      model: 'typesafe-ai/jev',
      state: q,
      questions: {
        kind: {
          type: 'choice',
          instructions: 'What kind of question is this?',
          criteria: KINDS,
        },
      },
      maxRetries: 0,
      // The browser gives up at 1200ms; stop paying for the call once nobody is waiting.
      abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(1100)]),
    });
    return Response.json({ kind: answers.kind.choice }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('predict failed:', err?.name);
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
