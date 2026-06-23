// A sentiment's polarity (the +1/0/−1 the cooling/trend math uses) is only a real DECISION when
// the label doesn't already reveal its direction. For self-evident labels (Positive/Neutral/
// Negative) the polarity is implied by the name, so the Settings UI hides the control and uses
// the implied value — no redundant "pick the level again" pill. Only custom-named sentiments
// (e.g. "Frustrated", "On fire") ask for it.
//
// Recognizes the English defaults AND the legacy Vietnamese defaults, so accounts seeded before
// the English seed migration also auto-hide the control until their labels are renamed.
const SELF_EVIDENT_POLARITY: Record<string, number> = {
  positive: 1,
  neutral: 0,
  negative: -1,
  // legacy Vietnamese defaults (transitional — pre-English-seed accounts)
  "tích cực": 1,
  "trung tính": 0,
  "tiêu cực": -1,
};

// The implied polarity of a label, or null if the label is custom (direction not self-evident).
export function selfEvidentPolarity(label: string): number | null {
  const v = SELF_EVIDENT_POLARITY[label.trim().toLowerCase()];
  return v === undefined ? null : v;
}

export function isSelfEvidentLabel(label: string): boolean {
  return selfEvidentPolarity(label) !== null;
}
