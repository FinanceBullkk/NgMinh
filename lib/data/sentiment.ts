import { createClient } from "@/lib/supabase/server";
import type { SentimentOption } from "@/lib/types/models";

// Active (non-archived) sentiment options, ordered for the picker + sparkline.
export async function listSentimentOptions(): Promise<SentimentOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sentiment_options")
    .select("*")
    .eq("is_archived", false)
    .order("order_index");
  if (error) throw error;
  return data;
}

// All options incl. archived — needed to render historical entry colors (spec §6).
export async function listAllSentimentOptions(): Promise<SentimentOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sentiment_options")
    .select("*")
    .order("order_index");
  if (error) throw error;
  return data;
}
