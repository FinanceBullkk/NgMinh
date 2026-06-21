// Group entries by day with relative labels, in Asia/Saigon (spec §7.3).
// entry_date is a plain 'YYYY-MM-DD' string (no time), so comparisons are date-only.

export type DayGroup<T> = { key: string; label: string; items: T[] };

function todayInSaigon(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Saigon" });
}

function daysAgo(date: string, today: string): number {
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${date}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

// Bucket key + label: today / yesterday / this-week / explicit older date.
function bucket(date: string, today: string): { key: string; label: string } {
  const diff = daysAgo(date, today);
  if (diff <= 0) return { key: "today", label: "Hôm nay" }; // future folds into today
  if (diff === 1) return { key: "yesterday", label: "Hôm qua" };
  if (diff < 7) return { key: "this-week", label: "Tuần này" };
  return { key: date, label: date };
}

export function groupByDay<T extends { entry_date: string }>(
  items: T[],
): DayGroup<T>[] {
  const today = todayInSaigon();
  const groups: DayGroup<T>[] = [];
  const index = new Map<string, DayGroup<T>>();
  for (const it of items) {
    const b = bucket(it.entry_date, today);
    let g = index.get(b.key);
    if (!g) {
      g = { key: b.key, label: b.label, items: [] };
      index.set(b.key, g);
      groups.push(g); // insertion order = newest-first (items arrive sorted)
    }
    g.items.push(it);
  }
  return groups;
}
