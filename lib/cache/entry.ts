// A cache entry binds a SWR key to the fetcher that fills it, so a view can never pair the
// wrong fetcher with a key, and an invalidation can never reference a key that isn't real.
//
//   CacheTarget — anything invalidation can match, incl. wildcards like `profile:*` (no fetcher).
//   EntryRef    — a CacheTarget you can also fetch (what useEntry() consumes).

// What invalidate() matches against. May be a wildcard with no fetcher — see family().all.
export type CacheTarget = { readonly key: string };

// A fetchable entry: key + the function that loads it. What useEntry() consumes.
export type EntryRef<T> = CacheTarget & { readonly fetcher: () => Promise<T> };

// Bind a static key to its fetcher.
export function entry<T>(key: string, fetcher: () => Promise<T>): EntryRef<T> {
  return { key, fetcher };
}

// A parametric key family (e.g. profile:<id>). `family("profile", fetchProfile)` returns a
// callable — `cache.profile(id)` → a fetchable EntryRef keyed `profile:<id>` — plus `.all`, a
// wildcard CacheTarget (`profile:*`) for invalidating every member at once. The `${prefix}:${arg}`
// join lives only here, so the key shape never leaks to call sites.
export function family<T, A extends string>(
  prefix: string,
  fetch: (arg: A) => Promise<T>,
): ((arg: A) => EntryRef<T>) & { readonly all: CacheTarget } {
  const make = (arg: A): EntryRef<T> => entry(`${prefix}:${arg}`, () => fetch(arg));
  return Object.assign(make, { all: { key: `${prefix}:*` } as CacheTarget });
}
