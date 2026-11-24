import { experimental_decide } from 'ai';
import { KINDS } from '../oracle.js';

const bad = () => Response.json({ error: 'bad request' }, { status: 400 });

export async function POST(request) {
  if (Number(request.headers.get('content-length')) > 1024) return bad();
  let q;
  try {
    q = (await request.json())?.q;
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
