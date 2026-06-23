"use client";

import { TimelineEntryRow } from "@/components/profile/timeline-entry";
import { QuickAdd } from "@/components/quick-add/quick-add-sheet";
import type { FeedEntry } from "@/lib/types/models";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Full English heading for a YYYY-MM-DD, e.g. "Tuesday · Jun 23". UTC parse → no TZ drift.
function dayHeading(date: string): string {
  const wd = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const [, m, dd] = date.split("-");
  return `${wd} · ${SHORT_MONTHS[parseInt(m, 10) - 1]} ${parseInt(dd, 10)}`;
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
          <span className="text-xs text-zinc-400">{entries.length} entries</span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400">No entries for this day.</p>
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
              + Log for this day
            </button>
          )}
        />
      </div>
    </div>
  );
}
