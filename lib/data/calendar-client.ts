"use client";

// Calendar data: the browser reads a single month's slice of the SAME `entries` table the Feed
// uses (one table, two axes — spec §2.2), bucketed later by entry_date. NOT paginated: a month
// is small, and a calendar must show every day's entries, not just a first page. Filtering by
// person/type happens client-side (the month set is already complete), so this fetch is keyed by
// month alone. RLS scopes rows to the current user, same as every other query.
import { createClient } from "@/lib/supabase/client";
import { resolveFeedRows } from "@/lib/data/feed-client";
import { monthRange } from "@/lib/utils/month-grid";
import type { FeedEntry } from "@/lib/types/models";

// All entries whose entry_date falls in `month` ('YYYY-MM'), newest-first, with employee name
// and sentiment {label,color} resolved.
export async function fetchEntriesForMonth(month: string): Promise<FeedEntry[]> {
  const supabase = createClient();
  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .gte("entry_date", start)
    .lte("entry_date", end)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return resolveFeedRows(supabase, data ?? []);
}
