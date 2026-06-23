"use client";

import { useMemo, useState } from "react";
import { FEED_PAGE } from "@/lib/cache";
import type { FeedBootstrap } from "@/lib/data/feed-client";
import type { EntryType } from "@/lib/types/models";
import type { FeedFilterState } from "@/lib/utils/entry-filter";
import { CalendarView } from "@/components/calendar/calendar-view";
import { FeedFilters } from "./feed-filters";
import { FeedList } from "./feed-list";
import { ViewToggle, type FeedViewMode } from "./view-toggle";

// Owns the by-time axis: the List/Calendar toggle and the shared filter state. Renders the
// filter bar ONCE; both views consume the same filter, so switching keeps the filter intact.
export function FeedShell({ bootstrap }: { bootstrap: FeedBootstrap }) {
  const { entries, employees, tags, tagsByEmployee } = bootstrap;
  const [view, setView] = useState<FeedViewMode>("list");
  const [person, setPerson] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<EntryType>>(new Set());

  const toggle = <T,>(set: Set<T>, v: T, apply: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    apply(next);
  };

  const filtering = !!person || selectedTypes.size > 0 || selectedTags.size > 0;

  // Tag → employee ids (the map lives here; the predicate just needs ids). null = no constraint.
  const tagEmployeeIds = useMemo(() => {
    if (selectedTags.size === 0) return null;
    const ids: string[] = [];
    for (const [empId, tagIds] of Object.entries(tagsByEmployee)) {
      if (tagIds.some((t) => selectedTags.has(t))) ids.push(empId);
    }
    return ids;
  }, [selectedTags, tagsByEmployee]);

  // Identity of the active filter — drives the Feed list's global fetch and validates its cache.
  const filterKey = useMemo(
    () =>
      `${person}|${[...selectedTypes].sort().join(",")}|${(tagEmployeeIds ?? []).slice().sort().join(",")}`,
    [person, selectedTypes, tagEmployeeIds],
  );

  // Memoized so its reference is stable across renders (e.g. toggling view) — both FeedList and
  // CalendarView key expensive memos off this object.
  const filter: FeedFilterState = useMemo(
    () => ({ person, selectedTypes, tagEmployeeIds, filtering, filterKey }),
    [person, selectedTypes, tagEmployeeIds, filtering, filterKey],
  );

  return (
    <div
      className={`flex flex-col gap-4 p-4 lg:mx-auto lg:px-7 lg:py-6 ${
        view === "calendar" ? "lg:max-w-5xl" : "lg:max-w-3xl"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-[25px]">Feed</h1>
          <span className="hidden text-sm text-zinc-400 lg:inline">whole team, over time</span>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <FeedFilters
        employees={employees}
        tags={tags}
        person={person}
        onPerson={setPerson}
        selectedTags={selectedTags}
        onToggleTag={(id) => toggle(selectedTags, id, setSelectedTags)}
        onClearTags={() => setSelectedTags(new Set())}
        selectedTypes={selectedTypes}
        onToggleType={(t) => toggle(selectedTypes, t, setSelectedTypes)}
        onClearTypes={() => setSelectedTypes(new Set())}
        filtering={filtering}
        scopeNote={view === "list"}
      />

      {view === "list" ? (
        <FeedList initialEntries={entries} pageSize={FEED_PAGE} filter={filter} />
      ) : (
        <CalendarView filter={filter} employees={employees} />
      )}
    </div>
  );
}
