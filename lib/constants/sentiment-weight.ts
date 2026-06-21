// Sentiment polarity options (spec Phase 2: drives "cooling" nudges).
export const WEIGHT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Tích cực (+)" },
  { value: 0, label: "Trung tính" },
  { value: -1, label: "Tiêu cực (−)" },
];

export function weightLabel(weight: number): string {
  return weight > 0 ? "Tích cực" : weight < 0 ? "Tiêu cực" : "Trung tính";
}
