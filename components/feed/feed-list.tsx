"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { FeedEntry } from "@/lib/types/models";
import { groupByDay } from "@/lib/utils/day-grouping";
import { mergeFeedPages } from "@/lib/utils/feed-merge";
import { matchesEntryFilter, type FeedFilterState } from "@/lib/utils/entry-filter";
import { fetchFeedPage, fetchFeedFiltered } from "@/lib/data/feed-client";
import { FeedDayGroup } from "./feed-day-group";

// The stream rendering of the by-time axis. Filter state is owned by the shell and passed in,
// so the List and Calendar views stay in sync. This component keeps pagination (load-more) and
// the global (all-time) refetch that a paginated list needs so filters aren't falsely bounded.
export function FeedList({
  initialEntries,
  pageSize,
  filter,
}: {
  initialEntries: FeedEntry[];
  pageSize: number;
  filter: FeedFilterState;
}) {
  const { person, selectedTypes, tagEmployeeIds, filtering, filterKey } = filter;

  // First page comes LIVE from the SWR prop (so a new/changed note shows immediately, without
  // re-mounting); "older" holds pages fetched via load-more.
  const [older, setOlder] = useState<FeedEntry[]>([]);
  const [exhausted, setExhausted] = useState(initialEntries.length < pageSize);
  const items = useMemo(() => mergeFeedPages(initialEntries, older), [initialEntries, older]);
  // Cached global result, tagged with the filter that produced it (so a stale result is never
  // shown after the filter changes).
  const [fetched, setFetched] = useState<{ key: string; items: FeedEntry[] } | null>(null);
  const [loading, start] = useTransition();
  const [filterPending, startFilter] = useTransition();

  // Global filter: when any filter is active, ask the server for ALL matches (not just the
  // loaded page) so older entries aren't falsely hidden.
  useEffect(() => {
    if (!filtering) return;
    const key = filterKey;
    startFilter(async () => {
      const res = await fetchFeedFiltered({
        employeeId: person || null,
        types: [...selectedTypes],
        employeeIds: tagEmployeeIds,
      });
      setFetched({ key, items: res });
    });
  }, [filtering, filterKey, person, selectedTypes, tagEmployeeIds]);

  // Optimistic view of already-loaded items while the global query is in flight.
  const localFiltered = useMemo(
    () => items.filter((e) => matchesEntryFilter(e, filter)),
    [items, filter],
  );

  // Use the global result only when it matches the current filter; otherwise the optimistic
  // local view bridges the gap until the matching fetch resolves.
  const globalMatch = filtering && fetched && fetched.key === filterKey ? fetched.items : null;
  const source = filtering ? (globalMatch ?? localFiltered) : items;
  const groups = useMemo(() => groupByDay(source), [source]);

  const loadMore = () =>
    start(async () => {
      const more = await fetchFeedPage(pageSize, items.length); // (limit, offset)
      setOlder((prev) => [...prev, ...more]);
      if (more.length < pageSize) setExhausted(true);
    });

  return (
    <>
      <div className={filterPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {groups.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {filtering ? "No entries match the filter." : "No entries yet"}
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
          {loading ? "Loading…" : "Load older"}
        </button>
      )}
    </>
  );
}
