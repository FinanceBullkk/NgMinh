import type { FeedEntry } from "@/lib/types/models";

// Merge the LIVE first page (from SWR, always fresh) with locally loaded "older" pages,
// de-duplicated by id and order-preserving (first page on top). Pure → unit-testable.
// Guards two bug classes we hit: the frozen-at-mount list, and duplicate rows when the
// first page grows (after a write) and shifts the load-more offset by one.
export function mergeFeedPages(first: FeedEntry[], older: FeedEntry[]): FeedEntry[] {
  const seen = new Set<string>();
  const out: FeedEntry[] = [];
  for (const e of [...first, ...older]) {
    if (!seen.has(e.id)) {
      seen.add(e.id);
      out.push(e);
    }
  }
  return out;
}

// Insert one entry into a feed list at its correct (entry_date, created_at) DESC slot, instead
// of always unshifting to the top. Keeps an optimistic back-dated entry in its real day group
// (the Feed query + groupByDay both assume DESC order). Pure → unit-testable. Returns a new array.
export function insertByFeedOrder(entries: FeedEntry[], e: FeedEntry): FeedEntry[] {
  // true when `a` sorts BELOW `b` (older): earlier date, or same date + earlier created_at.
  const sortsBelow = (a: FeedEntry, b: FeedEntry) =>
    a.entry_date !== b.entry_date ? a.entry_date < b.entry_date : a.created_at < b.created_at;
  const i = entries.findIndex((x) => sortsBelow(x, e)); // first existing entry that should sit below e
  const at = i === -1 ? entries.length : i;
  return [...entries.slice(0, at), e, ...entries.slice(at)];
}
