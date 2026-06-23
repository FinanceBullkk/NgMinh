"use client";

import { monthLabel } from "@/lib/utils/month-grid";

// Month heading + prev/next/today controls. On mobile, swiping the grid also changes month
// (handled in CalendarView); these are the explicit affordances.
export function MonthNav({
  month,
  onPrev,
  onNext,
  onToday,
}: {
  month: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-zinc-900">{monthLabel(month)}</h2>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToday}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Hôm nay
        </button>
        <button
          type="button"
          onClick={onPrev}
          aria-label="Tháng trước"
          className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600 hover:bg-zinc-50"
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Tháng sau"
          className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600 hover:bg-zinc-50"
        >
          <Chevron dir="right" />
        </button>
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points={dir === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );
}
