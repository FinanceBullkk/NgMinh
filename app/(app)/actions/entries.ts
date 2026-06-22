"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Entry CREATE and feed READS are client-direct now (browser→Supabase, RLS). The only
// server action left for entries is delete (kept server-side for symmetry; the client
// revalidates SWR after it resolves).
//
// Delete a mis-entered entry. Append-only forbids EDITING past content, but removing a
// typo is allowed (delete ≠ overwrite). RLS scopes the delete to the current user's rows.
export async function deleteEntry(
  entryId: string,
  employeeId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const { error } = await supabase.from("entries").delete().eq("id", entryId);
  if (error) return { error: error.message };

  revalidatePath(`/employees/${employeeId}`);
  return { ok: true };
}
