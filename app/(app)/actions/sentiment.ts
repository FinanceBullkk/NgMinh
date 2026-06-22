"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isHexColor, normalizeHex } from "@/lib/utils/hex-color";
import type { SentimentOption } from "@/lib/types/models";

// Sentiment colors appear on roster sparklines, profiles, feed dots and settings.
function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/settings");
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Polarity is constrained to -1 / 0 / +1 (negative / neutral / positive).
function normWeight(weight: number): number {
  return weight > 0 ? 1 : weight < 0 ? -1 : 0;
}

export async function createSentiment(
  label: string,
  color: string,
  weight = 0,
): Promise<{ option: SentimentOption } | { error: string }> {
  const l = label.trim();
  if (!l) return { error: "Tên trống." };
  if (!isHexColor(color)) return { error: "Màu không hợp lệ." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const { data: last } = await supabase
    .from("sentiment_options")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const order_index = (last?.order_index ?? -1) + 1;

  const { data, error } = await supabase
    .from("sentiment_options")
    .insert({ label: l, color: normalizeHex(color), order_index, weight: normWeight(weight) })
    .select("*")
    .single();
  if (error) return { error: error.message };

  revalidateAll();
  return { option: data };
}

export async function updateSentiment(
  id: string,
  label: string,
  color: string,
  weight = 0,
): Promise<{ error?: string }> {
  const l = label.trim();
  if (!l) return { error: "Tên trống." };
  if (!isHexColor(color)) return { error: "Màu không hợp lệ." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const { error } = await supabase
    .from("sentiment_options")
    .update({ label: l, color: normalizeHex(color), weight: normWeight(weight) })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateAll();
  return {};
}

export async function reorderSentiment(ids: string[]): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Chưa đăng nhập." };
  if (ids.length === 0) return {};

  // Atomic: one upsert (full rows) instead of N sequential UPDATEs that can half-apply.
  const { data: rows, error: readErr } = await supabase
    .from("sentiment_options")
    .select("*")
    .in("id", ids);
  if (readErr) return { error: readErr.message };

  const byId = new Map((rows ?? []).map((r) => [r.id, r]));
  const payload = ids
    .map((id, i) => {
      const row = byId.get(id);
      return row ? { ...row, order_index: i } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const { error } = await supabase.from("sentiment_options").upsert(payload);
  if (error) return { error: error.message };
  revalidateAll();
  return {};
}

export async function archiveSentiment(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Chưa đăng nhập." };

  // Guard: never archive the last active option (quick-add would have none).
  const { count } = await supabase
    .from("sentiment_options")
    .select("*", { count: "exact", head: true })
    .eq("is_archived", false);
  if ((count ?? 0) <= 1) {
    return { error: "Phải còn ít nhất 1 cảm nhận đang dùng." };
  }

  const { error } = await supabase
    .from("sentiment_options")
    .update({ is_archived: true })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateAll();
  return {};
}

export async function unarchiveSentiment(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Chưa đăng nhập." };

  const { error } = await supabase
    .from("sentiment_options")
    .update({ is_archived: false })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateAll();
  return {};
}
