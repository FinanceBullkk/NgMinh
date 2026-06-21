"use client";

import { ENTRY_TYPES } from "@/lib/constants/entry-types";
import type { EntryType, SentimentOption } from "@/lib/types/models";

export function TimelineFilters({
  type,
  sentimentId,
  sentiments,
  onType,
  onSentiment,
}: {
  type: EntryType | "";
  sentimentId: string;
  sentiments: SentimentOption[];
  onType: (t: EntryType | "") => void;
  onSentiment: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <select
        value={type}
        onChange={(e) => onType(e.target.value as EntryType | "")}
        className="rounded-md border border-zinc-300 px-2 py-1"
      >
        <option value="">Mọi loại</option>
        {ENTRY_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <select
        value={sentimentId}
        onChange={(e) => onSentiment(e.target.value)}
        className="rounded-md border border-zinc-300 px-2 py-1"
      >
        <option value="">Mọi cảm nhận</option>
        {sentiments.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
