// Aggregates one day's entries into proportional colored segments — a single-day slice of the
// signature sparkline, drawn under each calendar cell. Pure & unit-testable. Color comes from
// the sentiment config (data, not CSS); entries with no sentiment fold into a neutral segment.

// Matches the null-sentiment dot in TimelineEntryRow so the two views read consistently.
export const NEUTRAL_COLOR = "#d4d4d8"; // zinc-300

export type RibbonSegment = {
  color: string;
  count: number; // entries of this color
  ratio: number; // count / total, 0..1 — drives segment width
};

// One segment per distinct sentiment color (so a busy day reads as a mood mix, not slivers),
// in first-seen order. A single entry → one segment with ratio 1 (renders as a full pill).
export function buildDayRibbon(
  entries: { sentiment: { color: string } | null }[],
): RibbonSegment[] {
  if (entries.length === 0) return [];
  const order: string[] = [];
  const count = new Map<string, number>();
  for (const e of entries) {
    const color = e.sentiment?.color ?? NEUTRAL_COLOR;
    if (!count.has(color)) order.push(color);
    count.set(color, (count.get(color) ?? 0) + 1);
  }
  const total = entries.length;
  return order.map((color) => {
    const c = count.get(color)!;
    return { color, count: c, ratio: c / total };
  });
}
