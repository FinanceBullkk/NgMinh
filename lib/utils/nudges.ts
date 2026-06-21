import type { EntryType } from "@/lib/types/models";

// Action nudges (spec §8): surface employees who need attention.
export type NudgeEntry = { type: EntryType; entry_date: string; weight: number | null };
export type Nudges = { stale1on1: boolean; cooling: boolean };

function daysBetween(today: string, date: string): number {
  return Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
  );
}

export function computeNudges(
  entries: NudgeEntry[],
  today: string,
  opts: { staleDays?: number; coolingWindow?: number; minCooling?: number } = {},
): Nudges {
  const staleDays = opts.staleDays ?? 30;
  const coolingWindow = opts.coolingWindow ?? 5;
  const minCooling = opts.minCooling ?? 2;

  // Nothing logged yet → nothing to nudge (daily reminder covers the empty case).
  if (entries.length === 0) return { stale1on1: false, cooling: false };

  // stale1on1: an active employee with no 1:1 within the window (or none ever).
  const last1on1 = entries
    .filter((e) => e.type === "1:1")
    .map((e) => e.entry_date)
    .sort()
    .at(-1);
  const stale1on1 = !last1on1 || daysBetween(today, last1on1) > staleDays;

  // cooling: the most recent weighted entries average to a negative polarity.
  const weighted = entries
    .filter((e) => e.weight !== null)
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    .slice(0, coolingWindow);
  const cooling =
    weighted.length >= minCooling &&
    weighted.reduce((sum, e) => sum + (e.weight ?? 0), 0) / weighted.length < 0;

  return { stale1on1, cooling };
}

export function hasNudge(n: Nudges): boolean {
  return n.stale1on1 || n.cooling;
}
