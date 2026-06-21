"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EntryType } from "@/lib/types/models";

// Append (spec §2.1): entries are immutable evidence — created, never edited in MVP.
export async function createEntry(input: {
  employeeId: string;
  entry_date: string;
  type: EntryType;
  content: string;
  sentiment_id: string | null;
}): Promise<{ error?: string; ok?: boolean }> {
  const content = input.content.trim();
  if (!input.employeeId) return { error: "Thiếu nhân viên." };
  if (!content) return { error: "Nội dung trống." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const { error } = await supabase.from("entries").insert({
    employee_id: input.employeeId,
    entry_date: input.entry_date || new Date().toLocaleDateString("en-CA"),
    type: input.type,
    content,
    sentiment_id: input.sentiment_id,
  });
  if (error) return { error: error.message };

  revalidatePath("/"); // roster sparkline
  revalidatePath(`/employees/${input.employeeId}`); // profile timeline
  revalidatePath("/feed"); // feed (Phase 6)
  return { ok: true };
}
