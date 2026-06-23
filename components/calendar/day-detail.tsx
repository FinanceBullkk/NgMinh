"use client";

import { TimelineEntryRow } from "@/components/profile/timeline-entry";
import { QuickAdd } from "@/components/quick-add/quick-add-sheet";
import type { FeedEntry } from "@/lib/types/models";

const WEEKDAY_VI = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

// Full Vietnamese heading for a YYYY-MM-DD, e.g. "Thứ Ba · 23 Th6". UTC parse → no TZ drift.
function dayHeading(date: string): string {
  const wd = WEEKDAY_VI[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const [, m, dd] = date.split("-");
  return `${wd} · ${parseInt(dd, 10)} Th${parseInt(m, 10)}`;
}

// The selected day's notes. Shared by the desktop side-pane and the mobile bottom sheet.
// Reuses TimelineEntryRow (identical to Feed/Profile) and offers back-dated capture for any day.
export function DayDetail({
  date,
  entries,
  employees,
}: {
  date: string;
  entries: FeedEntry[];
  employees: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-2 pb-1">
        <h3 className="text-sm font-bold text-zinc-900">{dayHeading(date)}</h3>
        {entries.length > 0 && (
          <span className="text-xs text-zinc-400">{entries.length} ghi chép</span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400">Chưa có ghi chép ngày này.</p>
      ) : (
        <ul className="flex flex-col">
          {entries.map((e) => (
            <TimelineEntryRow
              key={e.id}
              entry={e}
              employee={{ id: e.employee_id, name: e.employeeName }}
            />
          ))}
        </ul>
      )}

      <div className="pt-3">
        <QuickAdd
          lazy
          initialDate={date}
          employees={employees}
          renderTrigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="w-full rounded-xl border border-dashed border-[#3f8f6b]/50 py-2.5 text-sm font-semibold text-[#3f8f6b] hover:bg-[#3f8f6b]/5"
            >
              + Ghi cho ngày này
            </button>
          )}
        />
      </div>
    </div>
  );
}
