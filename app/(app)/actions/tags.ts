"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateTagResult = { id: string } | { error: string };

// Reuses an existing tag (case-insensitive) or creates one. unique(user_id, name) guards dups.
export async function createTag(name: string): Promise<CreateTagResult> {
  const n = name.trim();
  if (!n) return { error: "Tên tag trống." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", n)
    .maybeSingle();
  if (existing) return { id: existing.id };

  const { data, error } = await supabase
    .from("tags")
    .insert({ name: n })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/");
  return { id: data.id };
}

export async function addTagToEmployee(
  employeeId: string,
  tagId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const { error } = await supabase
    .from("employee_tags")
    .insert({ employee_id: employeeId, tag_id: tagId });
  // 23505 = already linked; treat as success.
  if (error && error.code !== "23505") return { error: error.message };

  revalidatePath("/");
  return {};
}

export async function removeTagFromEmployee(
  employeeId: string,
  tagId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const { error } = await supabase
    .from("employee_tags")
    .delete()
    .eq("employee_id", employeeId)
    .eq("tag_id", tagId);
  if (error) return { error: error.message };

  revalidatePath("/");
  return {};
}
