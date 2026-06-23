"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clampCloseness } from "@/lib/utils/closeness";
import { searchEmployeeIdsByContent as dalSearch } from "@/lib/data/employees";

export type ActionState = { error?: string; ok?: boolean } | null;

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const textOrNull = (v: FormDataEntryValue | null) => text(v) || null;

export async function createEmployee(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = text(formData.get("name"));
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // user_id auto-set by DEFAULT auth.uid() + RLS WITH CHECK — never trust the client for it.
  const { error } = await supabase.from("employees").insert({
    name,
    role_title: textOrNull(formData.get("role_title")),
    team: textOrNull(formData.get("team")),
    start_date: textOrNull(formData.get("start_date")),
    closeness: clampCloseness(formData.get("closeness")),
  });
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function updateEmployee(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData.get("id"));
  if (!id) return { error: "Missing id." };
  const name = text(formData.get("name"));
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("employees")
    .update({
      name,
      role_title: textOrNull(formData.get("role_title")),
      team: textOrNull(formData.get("team")),
      start_date: textOrNull(formData.get("start_date")),
      closeness: clampCloseness(formData.get("closeness")),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function deleteEmployee(id: string): Promise<ActionState> {
  if (!id) return { error: "Missing id." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // FK CASCADE removes the employee's entries, goals and tag links.
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

// Read called from the client (debounced search) — exposed as a server action.
export async function searchEmployeeIdsByContent(q: string): Promise<string[]> {
  return dalSearch(q);
}

// Revise (spec §2.1): overwrite-in-place. Distinct from append (entries).
export async function updateCurrentTake(
  employeeId: string,
  value: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("employees")
    .update({ current_take: value })
    .eq("id", employeeId);
  if (error) return { error: error.message };

  revalidatePath(`/employees/${employeeId}`);
  return {};
}

export async function updateCloseness(
  employeeId: string,
  value: number,
): Promise<{ error?: string }> {
  const n = clampCloseness(String(value));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("employees")
    .update({ closeness: n })
    .eq("id", employeeId);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/employees/${employeeId}`);
  return {};
}
