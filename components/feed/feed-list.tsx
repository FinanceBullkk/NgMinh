"use client";

import { useMemo, useState, useTransition } from "react";
import type { EntryType, FeedEntry, SentimentOption, Tag } from "@/lib/types/models";
import { groupByDay } from "@/lib/utils/day-grouping";
import { loadMoreFeed } from "@/app/(app)/actions/entries";
import { FeedDayGroup } from "./feed-day-group";
import { FeedFilters } from "./feed-filters";
import { QuickAdd } from "@/components/quick-add/quick-add-sheet";

export function FeedList({
  initialEntries,
  pageSize,
  employees,
  tags,
  tagsByEmployee,
  sentiments,
}: {
  initialEntries: FeedEntry[];
  pageSize: number;
  employees: { id: string; name: string }[];
  tags: Tag[];
  tagsByEmployee: Record<string, string[]>;
  sentiments: SentimentOption[];
}) {
  const [items, setItems] = useState<FeedEntry[]>(initialEntries);
  const [exhausted, setExhausted] = useState(initialEntries.length < pageSize);
  const [person, setPerson] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<EntryType>>(new Set());
  const [loading, start] = useTransition();

  const toggle = <T,>(set: Set<T>, v: T, apply: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    apply(next);
  };

  const visible = useMemo(
    () =>
      items.filter((e) => {
        if (person && e.employee_id !== person) return false;
        if (selectedTypes.size && !selectedTypes.has(e.type)) return false;
        if (selectedTags.size) {
          const et = tagsByEmployee[e.employee_id] ?? [];
          if (!et.some((t) => selectedTags.has(t))) return false;
        }
        return true;
      }),
    [items, person, selectedTags, selectedTypes, tagsByEmployee],
  );

  const groups = useMemo(() => groupByDay(visible), [visible]);

  const loadMore = () =>
    start(async () => {
      const more = await loadMoreFeed(items.length, pageSize);
      setItems((prev) => [...prev, ...more]);
      if (more.length < pageSize) setExhausted(true);
    });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>
        <QuickAdd employees={employees} sentiments={sentiments} />
      </div>

      <FeedFilters
        employees={employees}
        tags={tags}
        person={person}
        onPerson={setPerson}
        selectedTags={selectedTags}
        onToggleTag={(id) => toggle(selectedTags, id, setSelectedTags)}
        selectedTypes={selectedTypes}
        onToggleType={(t) => toggle(selectedTypes, t, setSelectedTypes)}
      />

      {groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">Chưa có ghi chép.</p>
      ) : (
        groups.map((g) => <FeedDayGroup key={g.key} group={g} />)
      )}

      {!exhausted && (
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
