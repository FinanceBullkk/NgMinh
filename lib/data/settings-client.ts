"use client";

// Client-side Settings data: browser talks DIRECTLY to Supabase (no SSR round-trip through
// the serverless function). RLS scopes every row to the current user, same as server queries.
import { createClient } from "@/lib/supabase/client";
import type { SentimentOption, Tag } from "@/lib/types/models";

export type SettingsBootstrap = {
  sentiments: SentimentOption[];
  tags: Tag[];
};

// Fetch all sentiment options (incl. archived, ordered by order_index) and all tags (by name)
// in a single parallel round — shape matches what the server used to pass as props.
export async function fetchSettings(): Promise<SettingsBootstrap> {
  const supabase = createClient();
  const [sentRes, tagsRes] = await Promise.all([
    supabase.from("sentiment_options").select("*").order("order_index").order("created_at"),
    supabase.from("tags").select("*").order("name"),
  ]);
  if (sentRes.error) throw sentRes.error;
  if (tagsRes.error) throw tagsRes.error;
  return {
    sentiments: sentRes.data ?? [],
    tags: tagsRes.data ?? [],
  };
}
