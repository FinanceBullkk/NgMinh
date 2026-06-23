"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deletePeopleDataForClient } from "@/lib/data/user-data";
import { isRecentlyAuthenticated } from "@/lib/auth/recent-auth";
import { logEvent, logServerEvent } from "@/lib/security/audit";

// Destructive actions require a RECENT interactive sign-in (audit H4) — a valid session alone is
// not enough. `needsReauth` tells the UI to force a fresh Google login (prompt=login) and retry.
type DestructiveResult = { error?: string; ok?: boolean; needsReauth?: boolean };

// Wipe people data (employees → cascade entries/goals/employee_tags; tags). Keeps the account +
// sentiment config (spec §3: data control).
export async function deleteAllData(): Promise<DestructiveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!isRecentlyAuthenticated(user.last_sign_in_at, Date.now())) {
    await logEvent(supabase, "reauth_required", { action: "delete_all" });
    return { needsReauth: true };
  }

  try {
    await deletePeopleDataForClient(supabase);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete data." };
  }

  await logEvent(supabase, "delete_all", {});
  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/settings");
  return { ok: true };
}

// Self-delete via a scoped RPC (audit H4/M2) — no service-role key in the app runtime. The
// SECURITY DEFINER function deletes only auth.uid()'s own row; FK CASCADE wipes everything.
export async function deleteAccount(): Promise<{ error?: string; needsReauth?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!isRecentlyAuthenticated(user.last_sign_in_at, Date.now())) {
    await logEvent(supabase, "reauth_required", { action: "delete_account" });
    return { needsReauth: true };
  }

  const { error } = await supabase.rpc("delete_own_account");
  if (error) return { error: error.message };

  // DB audit row would cascade away with the account → record to server log instead.
  logServerEvent("delete_account", { userId: user.id });
  await supabase.auth.signOut();
  redirect("/login"); // throws NEXT_REDIRECT — must stay outside try/catch
}
