"use client";

// Client-side Feed data: the browser talks DIRECTLY to Supabase (no SSR round-trip through
// the serverless function), so on a far-from-DB host the data path is just browser→DB.
// RLS scopes every row to the current user, same as the server queries.
import { createClient } from "@/lib/supabase/client";
import type { Entry, EntryType, FeedEntry, Tag } from "@/lib/types/models";

type DbClient = ReturnType<typeof createClient>;

// Attach employeeName + sentiment {label,color} to raw entry rows. Exported so the Calendar
// (which reads a month-scoped slice of the same `entries` table) resolves rows identically.
export async function resolveFeedRows(supabase: DbClient, rows: Entry[]): Promise<FeedEntry[]> {
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

export type FeedBootstrap = {
  entries: FeedEntry[];
  employees: { id: string; name: string }[];
  tags: Tag[];
  tagsByEmployee: Record<string, string[]>;
};

// One parallel round to load everything the Feed needs (first page + filter sources).
export async function fetchFeedBootstrap(pageSize: number): Promise<FeedBootstrap> {
  const supabase = createClient();
  const [entriesRes, empRes, sentRes, tagsRes, linksRes] = await Promise.all([
    supabase
      .from("entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(0, pageSize - 1),
    supabase.from("employees").select("id, name").order("name"),
    supabase.from("sentiment_options").select("id, label, color"),
    supabase.from("tags").select("*").order("name"),
    supabase.from("employee_tags").select("employee_id, tag_id"),
  ]);
  const err = entriesRes.error || empRes.error || sentRes.error || tagsRes.error || linksRes.error;
  if (err) throw err;

  const name = new Map((empRes.data ?? []).map((e) => [e.id, e.name]));
  const sent = new Map(
    (sentRes.data ?? []).map((s) => [s.id, { label: s.label, color: s.color }]),
  );
  const entries: FeedEntry[] = (entriesRes.data ?? []).map((r) => ({
    ...r,
    employeeName: name.get(r.employee_id) ?? "—",
    sentiment: r.sentiment_id ? (sent.get(r.sentiment_id) ?? null) : null,
  }));

  const tagsByEmployee: Record<string, string[]> = {};
  for (const l of linksRes.data ?? []) (tagsByEmployee[l.employee_id] ??= []).push(l.tag_id);

  return {
    entries,
    employees: (empRes.data ?? []).map((e) => ({ id: e.id, name: e.name })),
    tags: tagsRes.data ?? [],
    tagsByEmployee,
  };
}

// Older window (load-more).
export async function fetchFeedPage(limit: number, offset: number): Promise<FeedEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return resolveFeedRows(supabase, data ?? []);
}

// Global filter — matches across the whole dataset (not just the loaded page).
export async function fetchFeedFiltered(filters: {
  employeeId?: string | null;
  types?: EntryType[];
  employeeIds?: string[] | null;
}): Promise<FeedEntry[]> {
  if (filters.employeeIds && filters.employeeIds.length === 0) return [];
  const supabase = createClient();
  let query = supabase
    .from("entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters.types && filters.types.length) query = query.in("type", filters.types);
  if (filters.employeeIds) query = query.in("employee_id", filters.employeeIds);
  const { data, error } = await query;
  if (error) throw error;
  return resolveFeedRows(supabase, data ?? []);
}
