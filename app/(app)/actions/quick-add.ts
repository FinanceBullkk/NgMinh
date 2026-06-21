"use server";

import { listEmployees } from "@/lib/data/employees";
import { listSentimentOptions } from "@/lib/data/sentiment";
import type { SentimentOption } from "@/lib/types/models";

// Data the global quick-add needs (nav FAB / sidebar). Loaded lazily on first open so
// it stays off the critical path of every page navigation (perf — fewer round trips).
export async function loadQuickAddData(): Promise<{
  employees: { id: string; name: string }[];
  sentiments: SentimentOption[];
}> {
  const [employees, sentiments] = await Promise.all([
    listEmployees(),
    listSentimentOptions(),
  ]);
  return {
    employees: employees.map((e) => ({ id: e.id, name: e.name })),
    sentiments,
  };
}
