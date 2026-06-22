"use client";

import { useEntry, cache, FEED_PAGE } from "@/lib/cache";
import { FeedList } from "./feed-list";

// Client-rendered Feed: fetches directly from Supabase (browser→DB), cached by SWR so
// revisiting the tab shows data instantly and refreshes in the background (Firebase-like).
export function FeedView() {
  const { data, error } = useEntry(cache.feed);

  if (error) {
    return <p className="p-4 text-sm text-red-600">Không tải được Feed. Thử tải lại trang.</p>;
  }
  if (!data) return <FeedSkeleton />;

  return (
    <FeedList
      initialEntries={data.entries}
      pageSize={FEED_PAGE}
      employees={data.employees}
      tags={data.tags}
      tagsByEmployee={data.tagsByEmployee}
    />
  );
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
