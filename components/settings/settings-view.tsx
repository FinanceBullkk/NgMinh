"use client";

import { useEntry, cache } from "@/lib/cache";
import { SentimentManager } from "./sentiment-manager";
import { TagManager } from "./tag-manager";
import { DataControls } from "./data-controls";

// Client-rendered Settings: fetches directly from Supabase (browser→DB), cached by SWR so
// navigation back to Settings is instant (shows cached data, revalidates in background).
export function SettingsView() {
  const { data, error } = useEntry(cache.settings);

  if (error) {
    return (
      <p className="p-4 text-sm text-red-600">
        Không tải được Settings. Thử tải lại trang.
      </p>
    );
  }

  return (
    <main className="flex flex-col gap-8 p-4 lg:mx-auto lg:max-w-[720px] lg:px-7 lg:py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      {!data ? (
        <SettingsSkeleton />
      ) : (
        <>
          <SentimentManager initial={data.sentiments} />
          <TagManager initial={data.tags} />
          <DataControls />
        </>
      )}
    </main>
  );
}

// Pulse skeleton that mirrors the real layout while the first fetch resolves.
function SettingsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      {/* Sentiment section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="h-4 w-32 rounded bg-zinc-200" />
          <div className="h-3 w-64 rounded bg-zinc-100" />
        </div>
        <div className="overflow-hidden rounded-[14px] border border-[#e4e4e7] bg-white">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-[#e4e4e7] px-4 py-3 last:border-b-0"
            >
              <div className="h-5 w-5 rounded-md bg-zinc-200" />
              <div className="h-3 w-24 rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Tags section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="h-4 w-12 rounded bg-zinc-200" />
          <div className="h-3 w-56 rounded bg-zinc-100" />
        </div>
        <div className="overflow-hidden rounded-[14px] border border-[#e4e4e7] bg-white p-3">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-7 w-16 rounded-full bg-zinc-100" />
            ))}
          </div>
        </div>
      </div>

      {/* Data controls section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="h-4 w-16 rounded bg-zinc-200" />
          <div className="h-3 w-48 rounded bg-zinc-100" />
        </div>
        <div className="overflow-hidden rounded-[14px] border border-[#e4e4e7] bg-white">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="h-3 w-32 rounded bg-zinc-200" />
            <div className="h-8 w-20 rounded-md bg-zinc-100" />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#e4e4e7] px-4 py-3">
            <div className="h-3 w-40 rounded bg-zinc-200" />
            <div className="h-8 w-24 rounded-md bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
