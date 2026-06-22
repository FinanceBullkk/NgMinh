"use client";

import { mutate } from "swr";
import { keyMatcher } from "./match";
import { cache } from "./registry";
import type { CacheTarget } from "./entry";

// Revalidate every cache matched by the given targets (refs and/or wildcards) in one mutate().
const revalidate = (...targets: CacheTarget[]) =>
  mutate(keyMatcher(...targets.map((t) => t.key)));

// Single source of truth for "which SWR caches does write X affect". Each write calls exactly
// one of these — never sprinkle mutate() across components. Targets are typed cache refs, so a
// rename/typo in a key can't silently break invalidation.
export const invalidate = {
  // A note created/deleted → Feed list + Roster (sparkline/nudges) + any open Profile timeline.
  entry: () => revalidate(cache.feed, cache.roster, cache.profile.all),
  // Sentiment label/color/weight ripple into Feed rows, Roster sparkline, Profile timeline,
  // and the Settings list itself.
  sentiment: () => revalidate(cache.settings, cache.feed, cache.roster, cache.profile.all),
  // Tags: Settings list + Roster chips/filter + Profile tags.
  tag: () => revalidate(cache.settings, cache.roster, cache.profile.all),
  // Employee add/edit/delete → Roster + Feed (name/cascade) + that Profile (default: all).
  employee: (id?: string) =>
    revalidate(cache.roster, cache.feed, id ? cache.profile(id) : cache.profile.all),
  // current_take / closeness show on the Roster card and the Profile.
  takeOrCloseness: (id: string) => revalidate(cache.roster, cache.profile(id)),
  // Goals show only on the Profile.
  goal: (id: string) => revalidate(cache.profile(id)),
};
