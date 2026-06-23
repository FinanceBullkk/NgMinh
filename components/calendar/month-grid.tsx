"use client";

import type { MonthDay } from "@/lib/utils/month-grid";
import type { FeedEntry } from "@/lib/types/models";
import { DayCell } from "./day-cell";

// Monday-first weekday header (Vietnamese): T2…CN.
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const NO_ENTRIES: FeedEntry[] = []; // stable empty ref for days with no notes

export function MonthGrid({
  matrix,
  byDay,
  selected,
  onSelect,
}: {
  matrix: MonthDay[];
  byDay: Map<string, FeedEntry[]>;
  selected: string;
  onSelect: (date: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {matrix.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            entries={byDay.get(day.date) ?? NO_ENTRIES}
            selected={day.date === selected}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
