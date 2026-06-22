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
