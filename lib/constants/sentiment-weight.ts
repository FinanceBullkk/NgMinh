// Sentiment polarity options (spec Phase 2: drives "cooling" nudges).
export const WEIGHT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Positive (+)" },
  { value: 0, label: "Neutral" },
  { value: -1, label: "Negative (−)" },
];

export function weightLabel(weight: number): string {
  return weight > 0 ? "Positive" : weight < 0 ? "Negative" : "Neutral";
}
