"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listFeedEntries, listFeedEntriesFiltered } from "@/lib/data/entries";
import type { EntryType, FeedEntry } from "@/lib/types/models";

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
  revalidatePath("/feed"); // feed
  return { ok: true };
}

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

  revalidatePath("/"); // roster sparkline
  revalidatePath(`/employees/${employeeId}`); // profile timeline
  revalidatePath("/feed"); // feed
  return { ok: true };
}

// Feed pagination — fetch an older window (called from the client "load older").
export async function loadMoreFeed(
  offset: number,
  limit = 50,
): Promise<FeedEntry[]> {
  return listFeedEntries(limit, offset);
}

// Feed global filter — query the whole dataset for the active filters (not just the
// loaded page). Called from the client whenever a person/type/tag filter is active.
export async function filterFeed(filters: {
  employeeId?: string | null;
  types?: EntryType[];
  employeeIds?: string[] | null;
}): Promise<FeedEntry[]> {
  return listFeedEntriesFiltered(filters);
}
