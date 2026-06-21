import { createClient } from "@/lib/supabase/server";
import type { Entry, EntryType, FeedEntry } from "@/lib/types/models";

type DbClient = Awaited<ReturnType<typeof createClient>>;

// Resolve raw entry rows into FeedEntry: attach employee name + sentiment {label,color}
// (config-driven, incl. archived options). Shared by the paginated and filtered queries.
async function resolveFeedRows(
  supabase: DbClient,
  rows: Entry[],
): Promise<FeedEntry[]> {
  if (rows.length === 0) return [];
  const [emps, sents] = await Promise.all([
    supabase.from("employees").select("id, name"),
    supabase.from("sentiment_options").select("id, label, color"),
  ]);
  const name = new Map((emps.data ?? []).map((e) => [e.id, e.name]));
  const sent = new Map(
    (sents.data ?? []).map((s) => [s.id, { label: s.label, color: s.color }]),
  );
  return rows.map((r) => ({
    ...r,
    employeeName: name.get(r.employee_id) ?? "—",
    sentiment: r.sentiment_id ? (sent.get(r.sentiment_id) ?? null) : null,
  }));
}

// Daily reminder: has the manager logged anything dated `date` yet?
export async function hasEntryOn(date: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("id")
    .eq("entry_date", date)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// Profile timeline (by-person): one employee, newest first.
export async function listEntriesByEmployee(employeeId: string): Promise<Entry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("employee_id", employeeId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Feed (by-time): whole roster, newest first, with employee name + sentiment resolved.
// Joins done in JS (employees/sentiments are small, RLS-scoped) — paginate by range.
export async function listFeedEntries(
  limit = 50,
  offset = 0,
): Promise<FeedEntry[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return resolveFeedRows(supabase, rows ?? []);
}

// Feed filtered (GLOBAL): match across the WHOLE dataset, not just the loaded page, so
// filtering by a person/type/tag surfaces older matches too (feed mock improvement #1).
// `employeeIds` is the set allowed by the tag filter (resolved on the client from the
// tag→employee map); pass null for "no tag constraint".
export async function listFeedEntriesFiltered(filters: {
  employeeId?: string | null;
  types?: EntryType[];
  employeeIds?: string[] | null;
}): Promise<FeedEntry[]> {
  // Tag filter that matches nobody → no rows, skip the query.
  if (filters.employeeIds && filters.employeeIds.length === 0) return [];

  const supabase = await createClient();
  let query = supabase
    .from("entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters.types && filters.types.length) query = query.in("type", filters.types);
  if (filters.employeeIds) query = query.in("employee_id", filters.employeeIds);

  const { data: rows, error } = await query;
  if (error) throw error;
  return resolveFeedRows(supabase, rows ?? []);
}
