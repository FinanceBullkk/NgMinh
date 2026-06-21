"use client";

import { QuickAdd } from "@/components/quick-add/quick-add-sheet";
import type { SentimentOption } from "@/lib/types/models";

// Shown on Roster when nothing has been logged today (spec §3 Phase 2). In-app only.
export function DailyReminder({
  employees,
  sentiments,
}: {
  employees: { id: string; name: string }[];
  sentiments: SentimentOption[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#3f8f6b]/30 bg-[#3f8f6b]/5 px-4 py-3">
      <p className="text-sm">Hôm nay bạn đã ghi nhận ai chưa?</p>
      <QuickAdd employees={employees} sentiments={sentiments} triggerLabel="+ Ghi" />
    </div>
  );
}
