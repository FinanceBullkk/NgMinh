"use client";

import { mutate } from "swr";
import { keyMatcher } from "@/lib/utils/cache-keys";
import type { FeedBootstrap } from "@/lib/data/feed-client";
import type { FeedEntry } from "@/lib/types/models";

// Single source of truth for "which SWR caches does write X affect".
// Cache keys in use: "roster" · "feed-bootstrap" · "settings" · "profile:<id>".

// Each write calls exactly one of these. Adding a new write? Pick the matching invalidator
// (or add one here) — never sprinkle mutate() calls across components again.
export const invalidate = {
  // A note created/deleted → Feed list + Roster (sparkline/nudges) + any open Profile timeline.
  entry: () => mutate(keyMatcher("feed-bootstrap", "roster", "profile:*")),
  // Sentiment label/color/weight ripple into Feed rows, Roster sparkline, Profile timeline,
  // and the Settings list itself.
  sentiment: () => mutate(keyMatcher("settings", "feed-bootstrap", "roster", "profile:*")),
  // Tags: Settings list + Roster chips/filter + Profile tags.
  tag: () => mutate(keyMatcher("settings", "roster", "profile:*")),
  // Employee add/edit/delete → Roster + Feed (name/cascade) + that Profile (default: all).
  employee: (id?: string) =>
    mutate(keyMatcher("roster", "feed-bootstrap", id ? `profile:${id}` : "profile:*")),
  // current_take / closeness show on the Roster card and the Profile.
  takeOrCloseness: (id: string) => mutate(keyMatcher("roster", `profile:${id}`)),
  // Goals show only on the Profile.
  goal: (id: string) => mutate(keyMatcher(`profile:${id}`)),
};

// Optimistic: drop a just-created entry into the Feed cache immediately so it shows without
// waiting for a refetch. The follow-up invalidate.entry() reconciles with the real row.
export function prependEntryToFeed(entry: FeedEntry) {
  return mutate(
    "feed-bootstrap",
    (cur?: FeedBootstrap) => (cur ? { ...cur, entries: [entry, ...cur.entries] } : cur),
    { revalidate: false },
  );
}
