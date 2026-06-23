"use client";

import { useEntry, cache } from "@/lib/cache";
import { FeedShell } from "./feed-shell";

// Client-rendered Feed boundary: fetches the bootstrap from Supabase (browser→DB), cached by
// SWR, then hands it to the shell which owns the List/Calendar toggle + shared filters.
export function FeedView() {
  const { data, error } = useEntry(cache.feed);

  if (error) {
    return <p className="p-4 text-sm text-red-600">Couldn’t load the Feed. Try reloading the page.</p>;
  }
  if (!data) return <FeedSkeleton />;

  return <FeedShell bootstrap={data} />;
}

// Lightweight placeholder while the first fetch resolves (shape matches the real layout).
function FeedSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 p-4 lg:mx-auto lg:max-w-3xl lg:px-7 lg:py-6">
      <div className="h-7 w-24 rounded bg-zinc-200" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-16 rounded-full bg-zinc-100" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 border-b border-zinc-100 py-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 rounded bg-zinc-200" />
            <div className="h-3 w-full rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
