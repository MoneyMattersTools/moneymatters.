// Single shared taxonomy for "what does this user need help with" /
// "what does this advisor specialize in" - SITE_STRATEGY.md's Advisor
// Connect Backend design explicitly calls out that these need to be one
// enum both sides map to, not free text on one side and structured tags
// on the other. This is that one list: the same values already used as
// the user intake checklist (request-advisor-review.mjs) are now also
// the only valid values for an advisor's specialty_tags.
const SPECIALTIES = [
  'Saving for retirement',
  'Paying off debt',
  'Buying a home',
  'Growing my investments',
  "Saving for a child's education",
  'Inheritance or major windfall',
  'Selling a business or equity compensation',
  'New to investing',
  'Not sure, just want general guidance',
];

// "How soon are you looking to start working with someone?" - the
// opportunity/urgency signal SITE_STRATEGY.md flags as the #2 lead-value
// driver, missing from intake today.
const URGENCY_OPTIONS = [
  { value: 'now', label: "I'm ready to start now" },
  { value: 'next_few_months', label: 'In the next few months' },
  { value: 'just_exploring', label: 'Just exploring for now' },
];

module.exports = {
  SPECIALTIES,
  SPECIALTIES_SET: new Set(SPECIALTIES),
  URGENCY_OPTIONS,
  URGENCY_VALUES: new Set(URGENCY_OPTIONS.map((o) => o.value)),
};
