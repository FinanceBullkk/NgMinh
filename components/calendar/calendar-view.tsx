"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEntry, cache } from "@/lib/cache";
import { todayInSaigon } from "@/lib/utils/today";
import { buildMonthMatrix, monthOf, shiftMonth } from "@/lib/utils/month-grid";
import { matchesEntryFilter, type FeedFilterState } from "@/lib/utils/entry-filter";
import type { FeedEntry } from "@/lib/types/models";
import { MonthNav } from "./month-nav";
import { MonthGrid } from "./month-grid";
import { DayDetail } from "./day-detail";

const NO_ENTRIES: FeedEntry[] = [];

// Calendar = the by-time axis as a month grid. Reads one month at a time (cache.calendar),
// filters client-side (the month set is complete), and shows the selected day's notes in a
// desktop side-pane / mobile bottom sheet. Mounts only when the Feed toggle selects it.
export function CalendarView({
  filter,
  employees,
}: {
  filter: FeedFilterState;
  employees: { id: string; name: string }[];
}) {
  const today = useMemo(() => todayInSaigon(), []);
  const [month, setMonth] = useState(() => monthOf(today));
  const [selected, setSelected] = useState(today);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, error } = useEntry(cache.calendar(month));

  // Bucket the month's (filtered) entries by exact entry_date for O(1) cell lookup.
  const byDay = useMemo(() => {
    const map = new Map<string, FeedEntry[]>();
    for (const e of data ?? []) {
      if (!matchesEntryFilter(e, filter)) continue;
      const arr = map.get(e.entry_date);
      if (arr) arr.push(e);
      else map.set(e.entry_date, [e]);
    }
    return map;
  }, [data, filter]);

  const matrix = useMemo(() => buildMonthMatrix(month, today), [month, today]);
  const selectedEntries = byDay.get(selected) ?? NO_ENTRIES;

  const goMonth = (delta: number) => {
    const next = shiftMonth(month, delta);
    setMonth(next);
    // Keep the selection inside the visible month so the pane/sheet never reflects an
    // off-screen day (today if we land on the current month, else the 1st).
    setSelected(next === monthOf(today) ? today : `${next}-01`);
  };
  const goToday = () => {
    setMonth(monthOf(today));
    setSelected(today);
  };
  const pick = (date: string) => {
    setSelected(date);
    setSheetOpen(true); // opens the mobile sheet; the desktop pane just reflects `selected`
  };

  // Horizontal swipe on the grid changes month (mobile).
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 60) goMonth(dx < 0 ? 1 : -1); // swipe left → next month
  };

  // Mobile sheet: lock body scroll + close on Escape. Skipped on desktop, where the sheet is
  // CSS-hidden (lg:hidden) and the side pane is always visible.
  useEffect(() => {
    if (!sheetOpen) return;
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sheetOpen]);

  if (error) {
    return <p className="py-12 text-center text-sm text-red-600">Couldn’t load the calendar. Try reloading the page.</p>;
  }

  return (
    <div className="lg:flex lg:gap-6">
      <div className="lg:min-w-0 lg:flex-1" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <MonthNav month={month} onPrev={() => goMonth(-1)} onNext={() => goMonth(1)} onToday={goToday} />
        <div className="pt-3">
          {!data ? (
            <GridSkeleton />
          ) : (
            <MonthGrid matrix={matrix} byDay={byDay} selected={selected} onSelect={pick} />
          )}
        </div>
        {data && filter.filtering && byDay.size === 0 && (
          <p className="pt-4 text-center text-sm text-zinc-500">
            No entries match the filter this month.
          </p>
        )}
      </div>

      {/* Desktop: permanent side pane that always shows the selected day. */}
      <aside className="hidden lg:block lg:w-80 lg:shrink-0 lg:border-l lg:border-zinc-100 lg:pl-5">
        <DayDetail date={selected} entries={selectedEntries} employees={employees} />
      </aside>

      {/* Mobile: bottom sheet over the grid. */}
      {sheetOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSheetOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Entries for the day"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl"
          >
            <div className="mx-auto mb-2 h-1.5 w-9 rounded-full bg-zinc-300" aria-hidden />
            <DayDetail date={selected} entries={selectedEntries} employees={employees} />
          </div>
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-7 gap-1">
      {Array.from({ length: 42 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-lg bg-zinc-100" />
      ))}
    </div>
  );
}
