import { createClient } from "@/lib/supabase/server";
import type { Tag } from "@/lib/types/models";

export async function listTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return data;
}

// All employee↔tag links for the current user (for the Feed tag filter).
export async function listEmployeeTagLinks(): Promise<
  { employee_id: string; tag_id: string }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_tags")
    .select("employee_id, tag_id");
  if (error) throw error;
  return data ?? [];
}
