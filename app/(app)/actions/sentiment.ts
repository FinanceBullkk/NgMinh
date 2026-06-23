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
  if (!l) return { error: "Name is empty." };
  if (!isHexColor(color)) return { error: "Invalid color." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

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
  if (!l) return { error: "Name is empty." };
  if (!isHexColor(color)) return { error: "Invalid color." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

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
  if (!user) return { error: "Not signed in." };
  if (ids.length === 0) return {};

  // Update ONLY order_index per row — never a read-then-rewrite of full rows, which would clobber
  // a concurrent label/color/weight edit with a stale value. order_index has no unique constraint,
  // so per-row updates can't transiently collide; RLS scopes each write to the owner. (label/color
  // are NOT NULL without defaults, so a partial upsert is not an option.)
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("sentiment_options").update({ order_index: i }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidateAll();
  return {};
}

export async function archiveSentiment(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  // Guard: never archive the last active option (quick-add would have none).
  const { count } = await supabase
    .from("sentiment_options")
    .select("*", { count: "exact", head: true })
    .eq("is_archived", false);
  if ((count ?? 0) <= 1) {
    return { error: "At least 1 sentiment must remain in use." };
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
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("sentiment_options")
    .update({ is_archived: false })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateAll();
  return {};
}
