"use client";

import type { MonthDay } from "@/lib/utils/month-grid";
import { buildDayRibbon } from "@/lib/utils/day-ribbon";
import type { FeedEntry } from "@/lib/types/models";

// One day in the month grid: day number + a proportional sentiment ribbon (the day's slice of
// the signature sparkline). Always tappable — a day with notes opens them, an empty day opens
// back-dated capture. Filler days from adjacent months are dimmed.
export function DayCell({
  day,
  entries,
  selected,
  onSelect,
}: {
  day: MonthDay;
  entries: FeedEntry[];
  selected: boolean;
  onSelect: (date: string) => void;
}) {
  const ribbon = buildDayRibbon(entries);
  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      aria-pressed={selected}
      aria-label={`${day.date}${entries.length ? `, ${entries.length} ghi chép` : ", chưa có ghi chép"}`}
      className={[
        "flex aspect-square flex-col items-center gap-1 rounded-lg p-1 transition-colors",
        day.inMonth ? "text-zinc-800" : "text-zinc-300",
        selected ? "bg-[#3f8f6b]/10 ring-2 ring-[#3f8f6b]" : "hover:bg-zinc-100",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-medium",
          day.isToday ? "bg-[#3f8f6b] font-bold text-white" : "",
        ].join(" ")}
      >
        {day.day}
      </span>
      {ribbon.length > 0 && (
        <span className="flex h-1.5 w-full max-w-[34px] overflow-hidden rounded-full" aria-hidden>
          {ribbon.map((seg, i) => (
            <span
              key={i}
              style={{ width: `${seg.ratio * 100}%`, backgroundColor: seg.color }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
