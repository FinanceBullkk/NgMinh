"use client";

import type { SentimentOption } from "@/lib/types/models";

// Colors come from the user's sentiment config — never hardcoded (spec §6).
export function SentimentButtonRow({
  sentiments,
  value,
  onChange,
}: {
  sentiments: SentimentOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sentiments.map((s) => {
        const on = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(on ? null : s.id)}
            style={
              on
                ? { backgroundColor: s.color, borderColor: s.color, color: "#fff" }
                : { borderColor: s.color, color: s.color }
            }
            className="rounded-full border px-3 py-1 text-sm"
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
