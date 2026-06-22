"use client";

import { useEntry, cache } from "@/lib/cache";
import { RosterGrid } from "./roster-grid";

// Client-rendered Roster: fetches directly from Supabase (browser→DB), cached by SWR so
// revisiting the tab shows data instantly and refreshes in the background.
export function RosterView() {
  const { data, error } = useEntry(cache.roster);

  if (error) {
    return (
      <p className="p-4 text-sm text-red-600">
        Không tải được Roster. Thử tải lại trang.
      </p>
    );
  }
  if (!data) return <RosterSkeleton />;

  return (
    <RosterGrid
      employees={data.cards}
      tags={data.tags}
      sentiments={data.sentiments}
      hasEntryToday={data.hasEntryToday}
    />
  );
}

// Pulse placeholder while the first fetch resolves — mirrors the card grid shape.
function RosterSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 p-4 lg:px-8 lg:py-6">
      {/* Top bar: title + button */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded bg-zinc-200" />
        <div className="h-8 w-24 rounded-md bg-zinc-200" />
      </div>
      {/* Tag filter chips */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-14 rounded-full bg-zinc-100" />
        ))}
      </div>
      {/* Card grid: 1 col mobile → 2 col sm → 3 col xl */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
