"use client";

import useSWR, { type SWRConfiguration } from "swr";
import type { EntryRef } from "./entry";

// Shared SWR behaviour for every data view: show cached data instantly, revalidate on focus,
// and keep previous data visible during a refetch (no flash back to skeleton). This was
// copy-pasted across all four views — now one default, overridable per call.
const DEFAULTS: SWRConfiguration = { revalidateOnFocus: true, keepPreviousData: true };

// Read a cache entry. Takes a bound ref (key + fetcher travel together) so a view can't pair a
// key with the wrong fetcher. Wildcard targets (CacheTarget without a fetcher) don't type-check.
export function useEntry<T>(ref: EntryRef<T>, opts?: SWRConfiguration) {
  return useSWR<T>(ref.key, ref.fetcher, { ...DEFAULTS, ...opts });
}
