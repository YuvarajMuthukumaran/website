// Expertise filters for the team explorer, derived only from each doctor's
// published designation and "Subject Expert" list (no invented specialties).
const TAGS: [string, RegExp][] = [
  ["Addiction", /addict|substance|alcohol|drug|de-?addiction/i],
  ["Anxiety", /anxiety|panic|phobia/i],
  ["Depression", /depress|mood/i],
  ["OCD", /\bocd\b|obsess/i],
  ["Bipolar", /bipolar/i],
  ["Schizophrenia", /schizo|psychos/i],
  ["Child & teen", /child|adolesc|teen|autism|adhd/i],
  ["Personality", /personality/i],
  ["Relationships", /marital|marriage|couple|family|relationship/i],
  ["Dementia & elderly", /dementia|geriatric|elder/i],
  ["Stress & trauma", /stress|trauma|ptsd/i],
  ["Rehabilitation", /rehabilitat/i],
];
export const TAG_LIST = TAGS.map(([t]) => t);
export const expertiseTags = (text: string) => TAGS.filter(([, re]) => re.test(text)).map(([t]) => t);
