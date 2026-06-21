"use client";

import { useMemo, useState } from "react";
import type { EntryType, SentimentOption, TimelineEntry } from "@/lib/types/models";
import { TimelineEntryRow } from "./timeline-entry";
import { TimelineFilters } from "./timeline-filters";

export function TimelineList({
  entries,
  sentiments,
}: {
  entries: TimelineEntry[];
  sentiments: SentimentOption[];
}) {
  const [type, setType] = useState<EntryType | "">("");
  const [sentimentId, setSentimentId] = useState("");

  const visible = useMemo(
    () =>
      entries.filter(
        (e) =>
          (!type || e.type === type) &&
          (!sentimentId || e.sentiment_id === sentimentId),
      ),
    [entries, type, sentimentId],
  );

  return (
    <section className="flex flex-col gap-2 p-4">
      <h2 className="text-sm font-medium">Timeline</h2>
      <TimelineFilters
        type={type}
        sentimentId={sentimentId}
        sentiments={sentiments}
        onType={setType}
        onSentiment={setSentimentId}
      />
      <ul className="flex flex-col">
        {visible.map((e) => (
          <TimelineEntryRow key={e.id} entry={e} />
        ))}
        {visible.length === 0 && (
          <li className="py-6 text-center text-xs text-zinc-400">
            Chưa có ghi chép.
          </li>
        )}
      </ul>
    </section>
  );
}
