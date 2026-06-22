// Public surface of the cache module.
//   Views: import { useEntry, cache }    → useEntry(cache.roster) / useEntry(cache.profile(id))
//   Writes: import { invalidate, cache } → invalidate.entry() / cache.feed.prepend(entry)
// The key matcher (./match) stays internal — only invalidate uses it.
export { cache, FEED_PAGE } from "./registry";
export { useEntry } from "./use-entry";
export { invalidate } from "./invalidate";
export type { CacheTarget, EntryRef } from "./entry";
