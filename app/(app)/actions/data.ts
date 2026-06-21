"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

// Wipe people data (employees → cascade entries/goals/employee_tags; tags).
// Keeps the account + sentiment config (spec §3: data control).
export async function deleteAllData(): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const emp = await supabase.from("employees").delete().neq("id", ZERO_UUID);
  if (emp.error) return { error: emp.error.message };
  const tag = await supabase.from("tags").delete().neq("id", ZERO_UUID);
  if (tag.error) return { error: tag.error.message };

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/settings");
  return { ok: true };
}

// Remove the auth user (service-role) → FK CASCADE wipes everything → sign out.
export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/login"); // throws NEXT_REDIRECT — must stay outside try/catch
}
