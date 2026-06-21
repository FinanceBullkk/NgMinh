import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeCard, Tag } from "@/lib/types/models";

// Reads are RLS-scoped to the current user. Writes live in Server Actions, not here.

export async function listEmployees(): Promise<Employee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Roster card data: employees + tags + recent sentiment colors. Joins done in JS
// (a few flat queries) to avoid nested-select typing friction and N+1 per card.
export async function listEmployeesWithMeta(): Promise<EmployeeCard[]> {
  const supabase = await createClient();
  const [emps, links, tags, entries, sentiments] = await Promise.all([
    supabase.from("employees").select("*").order("name"),
    supabase.from("employee_tags").select("employee_id, tag_id"),
    supabase.from("tags").select("*"),
    supabase
      .from("entries")
      .select("employee_id, sentiment_id")
      .order("entry_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("sentiment_options").select("id, color"),
  ]);
  const error = emps.error || links.error || tags.error || entries.error || sentiments.error;
  if (error) throw error;

  const colorById = new Map((sentiments.data ?? []).map((s) => [s.id, s.color]));
  const colorsByEmp = new Map<string, string[]>();
  for (const e of entries.data ?? []) {
    if (!e.sentiment_id) continue;
    const color = colorById.get(e.sentiment_id);
    if (!color) continue;
    const arr = colorsByEmp.get(e.employee_id) ?? [];
    arr.push(color);
    colorsByEmp.set(e.employee_id, arr);
  }

  const tagById = new Map<string, Tag>((tags.data ?? []).map((t) => [t.id, t]));
  const tagsByEmp = new Map<string, Tag[]>();
  for (const l of links.data ?? []) {
    const tag = tagById.get(l.tag_id);
    if (!tag) continue;
    const arr = tagsByEmp.get(l.employee_id) ?? [];
    arr.push(tag);
    tagsByEmp.set(l.employee_id, arr);
  }

  return (emps.data ?? []).map((e) => ({
    ...e,
    tags: tagsByEmp.get(e.id) ?? [],
    sentimentColors: (colorsByEmp.get(e.id) ?? []).slice(-20), // last 20, time order
  }));
}

// Employee ids whose entry content matches the query (ilike). MVP scale → no full-text
// index needed; flag GIN/full-text for Phase 2 if entry volume grows.
export async function searchEmployeeIdsByContent(q: string): Promise<string[]> {
  const term = q.trim();
  if (!term) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("employee_id")
    .ilike("content", `%${term}%`);
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.employee_id))];
}
