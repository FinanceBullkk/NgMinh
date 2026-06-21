"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { EntryType, FeedEntry, Tag } from "@/lib/types/models";
import { groupByDay } from "@/lib/utils/day-grouping";
import { loadMoreFeed, filterFeed } from "@/app/(app)/actions/entries";
import { FeedDayGroup } from "./feed-day-group";
import { FeedFilters } from "./feed-filters";

export function FeedList({
  initialEntries,
  pageSize,
  employees,
  tags,
  tagsByEmployee,
}: {
  initialEntries: FeedEntry[];
  pageSize: number;
  employees: { id: string; name: string }[];
  tags: Tag[];
  tagsByEmployee: Record<string, string[]>;
}) {
  const [items, setItems] = useState<FeedEntry[]>(initialEntries);
  const [exhausted, setExhausted] = useState(initialEntries.length < pageSize);
  const [person, setPerson] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<EntryType>>(new Set());
  // Cached global result, tagged with the filter that produced it (so a stale result is
  // never shown after the filter changes).
  const [filtered, setFiltered] = useState<{ key: string; items: FeedEntry[] } | null>(null);
  const [loading, start] = useTransition();
  const [filterPending, startFilter] = useTransition();

  const toggle = <T,>(set: Set<T>, v: T, apply: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    apply(next);
  };

  const filtering = !!person || selectedTypes.size > 0 || selectedTags.size > 0;

  // Employee ids allowed by the tag filter (null = no tag constraint). Computed here
  // because the client already holds the tag→employee map; the server filter just needs ids.
  const tagEmployeeIds = useMemo(() => {
    if (selectedTags.size === 0) return null;
    const ids: string[] = [];
    for (const [empId, tagIds] of Object.entries(tagsByEmployee)) {
      if (tagIds.some((t) => selectedTags.has(t))) ids.push(empId);
    }
    return ids;
  }, [selectedTags, tagsByEmployee]);

  // Identity of the active filter — drives the global fetch and validates its cached result.
  const filterKey = useMemo(
    () =>
      `${person}|${[...selectedTypes].sort().join(",")}|${(tagEmployeeIds ?? []).slice().sort().join(",")}`,
    [person, selectedTypes, tagEmployeeIds],
  );

  // Global filter: when any filter is active, ask the server for ALL matches (not just the
  // loaded page) so older entries aren't falsely hidden.
  useEffect(() => {
    if (!filtering) return;
    const key = filterKey;
    startFilter(async () => {
      const res = await filterFeed({
        employeeId: person || null,
        types: [...selectedTypes],
        employeeIds: tagEmployeeIds,
      });
      setFiltered({ key, items: res });
    });
  }, [filtering, filterKey, person, selectedTypes, tagEmployeeIds]);

  // Optimistic view of already-loaded items while the global query is in flight, so the
  // list reacts instantly; replaced by `filtered` (the authoritative superset) on arrival.
  const localFiltered = useMemo(
    () =>
      items.filter((e) => {
        if (person && e.employee_id !== person) return false;
        if (selectedTypes.size && !selectedTypes.has(e.type)) return false;
        if (tagEmployeeIds && !tagEmployeeIds.includes(e.employee_id)) return false;
        return true;
      }),
    [items, person, selectedTypes, tagEmployeeIds],
  );

  // Use the global result only when it matches the current filter; otherwise the optimistic
  // local view bridges the gap until the matching fetch resolves.
  const globalMatch =
    filtering && filtered && filtered.key === filterKey ? filtered.items : null;
  const source = filtering ? (globalMatch ?? localFiltered) : items;
  const groups = useMemo(() => groupByDay(source), [source]);

  const loadMore = () =>
    start(async () => {
      const more = await loadMoreFeed(items.length, pageSize);
      setItems((prev) => [...prev, ...more]);
      if (more.length < pageSize) setExhausted(true);
    });

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>

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
      />

      <div className={filterPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {groups.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {filtering ? "Không có ghi chép khớp bộ lọc." : "Chưa có ghi chép."}
          </p>
        ) : (
          groups.map((g) => <FeedDayGroup key={g.key} group={g} />)
        )}
      </div>

      {!filtering && !exhausted && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="self-center rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Đang tải…" : "Tải thêm cũ hơn"}
        </button>
      )}
    </div>
  );
}
