"use client";

// Client-side Roster data: the browser talks DIRECTLY to Supabase (no SSR round-trip through
// the serverless function). RLS scopes every row to the current user, same as server queries.
import { createClient } from "@/lib/supabase/client";
import { buildSentimentColorSeries } from "@/lib/utils/sparkline-points";
import { computeNudges } from "@/lib/utils/nudges";
import { todayInSaigon } from "@/lib/utils/today";
import type { EmployeeCard, SentimentOption, Tag } from "@/lib/types/models";

// Cap the roster entries fetch to a recent window so it stays bounded over the notebook's
// lifetime — sparkline uses the last ~20 and nudges look at recent weeks, so a year is ample.
const ROSTER_ENTRY_WINDOW_DAYS = 365;

export type RosterBootstrap = {
  cards: EmployeeCard[];
  tags: Tag[];
  sentiments: SentimentOption[];
  hasEntryToday: boolean;
};

// One parallel round to load everything the Roster page needs:
//   employees + employee_tags + tags + entries + sentiment_options
// Then assemble EmployeeCard[] using the same pure helpers as the SSR version.
export async function fetchRoster(): Promise<RosterBootstrap> {
  const supabase = createClient();
  const today = todayInSaigon();
  const cutoff = new Date(Date.now() - ROSTER_ENTRY_WINDOW_DAYS * 86_400_000)
    .toLocaleDateString("en-CA", { timeZone: "Asia/Saigon" });

  const [empsRes, linksRes, tagsRes, entriesRes, sentsRes, todayRes] =
    await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("employee_tags").select("employee_id, tag_id"),
      supabase.from("tags").select("*").order("name"),
      supabase
        .from("entries")
        .select("employee_id, sentiment_id, entry_date, created_at, type")
        .gte("entry_date", cutoff)
        .order("entry_date", { ascending: true })
        .order("created_at", { ascending: true }),
      // Include all sentiment options (incl. archived) so sparkline renders historical colors.
      supabase.from("sentiment_options").select("*").order("order_index").order("created_at"),
      // hasEntryToday: any row dated today
      supabase.from("entries").select("id").eq("entry_date", today).limit(1),
    ]);

  const err =
    empsRes.error ||
    linksRes.error ||
    tagsRes.error ||
    entriesRes.error ||
    sentsRes.error ||
    todayRes.error;
  if (err) throw err;

  // Group entries by employee for O(n) sparkline + nudge construction.
  const entriesByEmp = new Map<
    string,
    { employee_id: string; sentiment_id: string | null; entry_date: string; created_at: string; type: string }[]
  >();
  for (const e of entriesRes.data ?? []) {
    const rows = entriesByEmp.get(e.employee_id) ?? [];
    rows.push(e);
    entriesByEmp.set(e.employee_id, rows);
  }

  // Build tag lookup.
  const tagById = new Map<string, Tag>(
    (tagsRes.data ?? []).map((t) => [t.id, t]),
  );
  const tagsByEmp = new Map<string, Tag[]>();
  for (const l of linksRes.data ?? []) {
    const tag = tagById.get(l.tag_id);
    if (!tag) continue;
    const arr = tagsByEmp.get(l.employee_id) ?? [];
    arr.push(tag);
    tagsByEmp.set(l.employee_id, arr);
  }

  // Weight lookup for nudge computation.
  const weightById = new Map(
    (sentsRes.data ?? []).map((s) => [s.id, s.weight]),
  );

  const cards: EmployeeCard[] = (empsRes.data ?? []).map((e) => {
    const rows = entriesByEmp.get(e.id) ?? [];
    return {
      ...e,
      tags: tagsByEmp.get(e.id) ?? [],
      sentimentColors: buildSentimentColorSeries(rows, sentsRes.data ?? []),
      nudges: computeNudges(
        rows.map((r) => ({
          type: r.type as Parameters<typeof computeNudges>[0][number]["type"],
          entry_date: r.entry_date,
          weight: r.sentiment_id ? (weightById.get(r.sentiment_id) ?? null) : null,
        })),
        today,
      ),
    };
  });

  // Active (non-archived) sentiment options for the picker / daily reminder.
  const sentiments = (sentsRes.data ?? []).filter((s) => !s.is_archived);

  return {
    cards,
    tags: tagsRes.data ?? [],
    sentiments,
    hasEntryToday: (todayRes.data?.length ?? 0) > 0,
  };
}
