"use client";

// Quick-add picker data, fetched directly from the browser (fast, always fresh) each time
// the sheet opens — so a newly added employee shows up without a reload.
import { createClient } from "@/lib/supabase/client";
import type { SentimentOption } from "@/lib/types/models";

export async function fetchQuickAddData(): Promise<{
  employees: { id: string; name: string }[];
  sentiments: SentimentOption[];
}> {
  const supabase = createClient();
  const [emps, sents] = await Promise.all([
    supabase.from("employees").select("id, name").order("name"),
    supabase
      .from("sentiment_options")
      .select("*")
      .eq("is_archived", false)
      .order("order_index"),
  ]);
  if (emps.error) throw emps.error;
  if (sents.error) throw sents.error;
  return {
    employees: (emps.data ?? []).map((e) => ({ id: e.id, name: e.name })),
    sentiments: sents.data ?? [],
  };
}
