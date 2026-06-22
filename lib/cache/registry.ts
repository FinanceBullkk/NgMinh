"use client";

import { mutate } from "swr";
import { entry, family } from "./entry";
import { fetchRoster } from "@/lib/data/roster-client";
import { fetchSettings } from "@/lib/data/settings-client";
import { fetchProfile } from "@/lib/data/profile-client";
import { fetchFeedBootstrap, type FeedBootstrap } from "@/lib/data/feed-client";
import type { FeedEntry } from "@/lib/types/models";

// First-page size for the Feed: the bootstrap fetch and the FeedList "load more" page size are
// intentionally the same number. Single source so they can't drift.
export const FEED_PAGE = 50;

// The Feed entry carries an optimistic prepend (it knows both the key and the payload shape it
// mutates), so that knowledge lives beside the entry instead of scattered at the call site.
const feedEntry = entry("feed-bootstrap", () => fetchFeedBootstrap(FEED_PAGE));

// Single source of truth for every SWR cache key + how it's fetched. The literal key string
// lives ONLY here — views (useEntry) and writes (invalidate) reference these refs, so a
// key↔fetcher or key↔invalidation desync is no longer representable.
export const cache = {
  roster: entry("roster", fetchRoster),
  settings: entry("settings", fetchSettings),
  // Parametric: cache.profile(id) reads one profile; cache.profile.all invalidates every profile.
  profile: family("profile", fetchProfile),
  feed: Object.assign(feedEntry, {
    // Drop a just-created entry into the cached Feed immediately (no refetch); the follow-up
    // invalidate.entry() reconciles with the real row.
    prepend(e: FeedEntry) {
      return mutate(
        feedEntry.key,
        (cur?: FeedBootstrap) => (cur ? { ...cur, entries: [e, ...cur.entries] } : cur),
        { revalidate: false },
      );
    },
  }),
};
