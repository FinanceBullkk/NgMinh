// Plain-language read of recent sentiment "level" — turns the sparkline's colored dots into a
// statement (warming / stable / cooling) so the feature's payoff is self-evident. Pure & testable.
//
// LEVEL-based, and 'cool' uses the SAME window/threshold as nudges.ts cooling (avg polarity of the
// most recent ≤window sentiment-bearing entries < 0) — so there is ONE notion of "cooling",
// not two. < min weighted entries → 'insufficient' (the UI invites the user to log more).

export type SentimentTrend = "warm" | "stable" | "cool" | "insufficient";

type WeightedEntry = { entry_date: string; weight: number | null };

export function computeSentimentTrend(
  entries: WeightedEntry[],
  opts: { window?: number; min?: number } = {},
): SentimentTrend {
  const window = opts.window ?? 5;
  const min = opts.min ?? 2;
  const weighted = entries
    .filter((e) => e.weight !== null)
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    .slice(0, window);
  if (weighted.length < min) return "insufficient";
  const avg = weighted.reduce((sum, e) => sum + (e.weight ?? 0), 0) / weighted.length;
  if (avg < 0) return "cool"; // aligned with nudges.ts cooling
  if (avg > 0) return "warm";
  return "stable";
}
