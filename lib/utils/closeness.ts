// Closeness = how well the manager knows a report (1–5, spec §4).
const LABELS = ["—", "Distant", "Somewhat distant", "Moderate", "Close", "Very close"];

export function closenessLabel(value: number | null): string {
  if (!value) return LABELS[0];
  return LABELS[Math.min(5, Math.max(1, Math.round(value)))];
}

export function clampCloseness(raw: FormDataEntryValue | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 3; // default
  return Math.min(5, Math.max(1, Math.round(n)));
}
