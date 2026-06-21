import type { Goal, TimelineEntry } from "@/lib/types/models";

export function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

// Gather win/concern entries in a date range + all goals → markdown to paste into a
// review form (spec §3 Phase 2). Pure → unit-tested.
export function buildReviewMarkdown(
  name: string,
  entries: TimelineEntry[],
  goals: Goal[],
  from: string,
  to: string,
): string {
  const wins = entries.filter((e) => e.type === "win" && inRange(e.entry_date, from, to));
  const concerns = entries.filter((e) => e.type === "concern" && inRange(e.entry_date, from, to));
  const section = (rows: string[]) => (rows.length ? rows : ["- (không có)"]);

  return [
    `## ${name} — review ${from} → ${to}`,
    "",
    "### Wins",
    ...section(wins.map((e) => `- ${e.entry_date}: ${e.content}`)),
    "",
    "### Concerns",
    ...section(concerns.map((e) => `- ${e.entry_date}: ${e.content}`)),
    "",
    "### Goals",
    ...section(goals.map((g) => `- [${g.status}] ${g.content}`)),
    "",
  ].join("\n");
}
