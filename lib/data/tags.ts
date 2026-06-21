import { createClient } from "@/lib/supabase/server";
import type { Tag } from "@/lib/types/models";

export async function listTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return data;
}
