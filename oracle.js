// Shared by the browser and the /api/predict function. No dependencies.

export const KINDS = {
  yesno: 'Can be answered with yes or no.',
  when: 'Asks for a time or a date.',
  who: 'Asks for a person.',
  amount: 'Asks how many, how much, how long, how old, or for a number.',
  why: 'Asks for a reason.',
  where: 'Asks for a place.',
  how: 'Asks for a manner or method (not an amount).',
  which: 'Asks to choose between named alternatives, like "X or Y" or "which one".',
  what: 'Open question asking for a thing.',
  other: 'Not a question at all: a statement, greeting, gibberish, or a joke.',
};

export const POOLS = {
  yesno: ['Yes', 'No', 'Maybe', 'Yeah', 'Nope', 'Presumably', 'Obviously', 'Doubtful', 'Probably', 'Unlikely', 'Absolutely', 'Sure', 'Eventually', 'Barely', 'Technically', 'Hopefully', 'Inevitably', 'Nah', 'Definitely', 'Arguably', 'Mostly', 'Ideally', 'Allegedly', 'Reportedly', 'Supposedly'],
  when: ['Soon', 'Shortly', 'Tuesday', 'Eventually', 'Tomorrow', 'Later', 'Already', 'Thursday', 'Winter', 'Midnight', 'Yesterday', 'Momentarily', 'Someday', 'Lunchtime', 'Overnight', 'Afterwards', 'Recently'],
  who: ['You', 'Whoever', 'Everyone', 'Kevin', 'Them', 'Somebody', 'Linda', 'Me', 'Management', 'Accounting', 'Experts', 'Neighbor', 'Landlord', 'Gary'],
  amount: ['Seven', 'None', 'Plenty', 'Enough', 'Twelve', 'Lots', 'Dozens', 'Roughly', 'Three', 'Thousands', 'Several', 'Eleven', 'Four', 'Countless', 'Some', 'Scarcely', 'Most'],
  why: ['Because', 'Money', 'Fate', 'Habit', 'Spite', 'Boredom', 'Physics', 'Logistics', 'Reasons', 'Tradition', 'Scheduling', 'Policy', 'Weather', 'Coincidence', 'Bureaucracy', 'Mercury'],
  where: ['Ohio', 'Nearby', 'Elsewhere', 'Home', 'Inside', 'Basement', 'Online', 'Nowhere', 'Upstairs', 'Outside', 'Downstairs', 'Here', 'Abroad', 'Delaware', 'Somewhere', 'Indoors'],
  how: ['Slowly', 'Carefully', 'Peacefully', 'Quietly', 'Luck', 'Practice', 'Poorly', 'Somehow', 'Barely', 'Sideways', 'Awkwardly', 'Manually', 'Reluctantly', 'Gradually', 'Politely', 'Loudly'],
  which: ['Neither', 'Both', 'Former', 'Latter', 'Whichever', 'Either', 'Cheaper', 'Bigger', 'Closer', 'Left', 'Second', 'Mine'],
  what: ['Nothing', 'Laundry', 'Soup', 'Taxes', 'Bees', 'Paperwork', 'Something', 'Trouble', 'Sandwiches', 'Regret', 'Leftovers', 'Emails', 'Meetings', 'Cardio', 'Beige', 'Errands'],
  other: ['Funny', 'Okay', 'Noted', 'Wow', 'Hello', 'Sure', 'Indeed', 'Fascinating', 'Hm', 'Anyway', 'Right', 'Mhm', 'Received', 'Alright', 'Copy', 'Understood'],
};

const AUX = /^(?:(?:is|are|am|was|were|do|does|did|will|would|should|shall|can|could|may|might|have|has|had|must)(?:n't)?|won't|can't|shan't)\b/;

// Ordered; first match wins. Used when the AI call fails.
const RULES = [
  ['who', /\b(?:who|whom|whose)\b/],
  ['when', /^when\b|\bwhen (?:will|would|do|does|did|is|are|am|was|were|can|could|should|shall|have|has|must|might|may)\b|\bwhat(?:'s| is| was)?(?: the)? (?:time|day|date|year)\b|\bhow soon\b/],
  ['where', /\bwhere\b/],
  ['why', /\bwhy\b|\bhow come\b/],
  ['amount', /\bhow (?:many|much|long|old|far|often|tall|big)\b/],
  ['how', /\bhow\b/],
  ['which', /\bwhich\b| or /],
  ['what', /\bwhat\b/],
  ['yesno', AUX],
];

export function guessKind(q) {
  const s = String(q).toLowerCase().replace(/[’‘]/g, "'").trim();
  for (const [kind, re] of RULES) if (re.test(s)) return kind;
  return s.endsWith('?') ? 'yesno' : 'other';
}

export function pick(kind, last) {
  const pool = POOLS[kind] || POOLS.other;
  let w;
  do w = pool[Math.floor(Math.random() * pool.length)];
  while (pool.length > 1 && w === last);
  return w;
}
