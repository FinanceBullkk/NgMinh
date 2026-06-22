"use client";

import { mutate } from "swr";

// SWR cache keys used by the client-rendered pages:
//   "roster" · "feed-bootstrap" · "settings" · "profile:<id>"
// After a write (Server Action) resolves, the calling client component revalidates the
// affected caches so the UI updates without a full reload.

// An entry was created/deleted → affects Feed, Roster (sparkline/nudges) and any Profile.
export function revalidateAfterEntryWrite() {
  return mutate(
    (key) =>
      typeof key === "string" &&
      (key === "roster" || key === "feed-bootstrap" || key.startsWith("profile:")),
  );
}

// Revalidate a single named cache (e.g. after editing tags/sentiments/employees).
export function revalidateKey(key: string) {
  return mutate(key);
}
