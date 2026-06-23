// Group entries by day with relative labels, in Asia/Saigon (spec §7.3).
// entry_date is a plain 'YYYY-MM-DD' string (no time), so comparisons are date-only.

import { todayInSaigon } from "@/lib/utils/today";

export type DayGroup<T> = { key: string; label: string; items: T[] };

function daysAgo(date: string, today: string): number {
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${date}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

// Bucket key + label: today / yesterday / this-week / explicit older date.
function bucket(date: string, today: string): { key: string; label: string } {
  const diff = daysAgo(date, today);
  if (diff <= 0) return { key: "today", label: "Today" }; // future folds into today
  if (diff === 1) return { key: "yesterday", label: "Yesterday" };
  if (diff < 7) return { key: "this-week", label: "This week" };
  return { key: date, label: date };
}

// `today` is a parameter (default = now) so the caller can pass a render-fresh value: a memoized
// caller that froze `today` at mount would otherwise show stale "Hôm nay"/"Hôm qua" past midnight.
export function groupByDay<T extends { entry_date: string }>(
  items: T[],
  today: string = todayInSaigon(),
): DayGroup<T>[] {
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
