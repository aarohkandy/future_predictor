import assert from 'node:assert/strict';
import { KINDS, POOLS, guessKind, pick } from './oracle.js';
import { POST } from './api/predict.js';

const ids = ['yesno', 'when', 'who', 'amount', 'why', 'where', 'how', 'which', 'what', 'other'];
assert.deepEqual(Object.keys(KINDS).sort(), [...ids].sort());
assert.deepEqual(Object.keys(POOLS).sort(), [...ids].sort());
for (const [k, pool] of Object.entries(POOLS))
  for (const w of pool) assert.match(w, /^[A-Z][a-z]{0,10}$/, `${k}: ${w}`);

const cases = {
  'Will I get rich?': 'yesno', "Isn't it Friday?": 'yesno', "Won't this work": 'yesno', 'Is this a good idea': 'yesno',
  'When will I find love?': 'when', 'What time is it?': 'when', "What's the date today?": 'when', 'What happens when I die?': 'what',
  'Who will win the election?': 'who',
  'How many cats will I own?': 'amount', 'How long until I retire?': 'amount',
  'Why is the sky blue?': 'why', 'How come I am tired?': 'why',
  'Where will I live?': 'where',
  'How will I die?': 'how',
  'Should I eat pizza or tacos?': 'which', 'Which job should I take?': 'which',
  'What will I eat tomorrow?': 'what',
  'hello': 'other', 'asdfgh': 'other',
};
for (const [q, kind] of Object.entries(cases)) assert.equal(guessKind(q), kind, q);
assert.equal(guessKind('so cool?'), 'yesno');

for (const kind of [...ids, 'bogus']) {
  let last;
  for (let i = 0; i < 500; i++) {
    const w = pick(kind, last);
    assert.notEqual(w, last);
    assert.ok((POOLS[kind] || POOLS.other).includes(w));
    last = w;
  }
}

const post = (body) => POST(new Request('http://x/api/predict', { method: 'POST', body }));
for (const body of ['{}', '{"q":""}', '{"q":"   "}', '{"q":5}', 'null', JSON.stringify({ q: 'a'.repeat(201) }), '{not json', JSON.stringify({ q: 'hi', pad: 'x'.repeat(5000) })])
  assert.equal((await post(body)).status, 400, body);

assert.equal((await POST(new Request('http://x/api/predict', { method: 'POST' }))).status, 400, 'no body');

// A body that never finishes must be cut off by the read deadline, not hang the function.
const stalled = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"q":"h')); } });
const t0 = Date.now();
assert.equal((await POST(new Request('http://x/api/predict', { method: 'POST', body: stalled, duplex: 'half' }))).status, 400, 'stalled body');
assert.ok(Date.now() - t0 < 2000, 'stalled body took too long');

console.log('ok');
