"use client";

import { ENTRY_TYPES } from "@/lib/constants/entry-types";
import type { EntryType } from "@/lib/types/models";

// Timeline filter as chips (Profile mock #6): one tap to view only Win / Lo ngại when
// writing a review. "" = all types.
export function TimelineFilters({
  type,
  onType,
}: {
  type: EntryType | "";
  onType: (t: EntryType | "") => void;
}) {
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600"
    }`;

  return (
    <div className="flex flex-wrap gap-1.5">
      <button onClick={() => onType("")} aria-pressed={!type} className={chip(!type)}>
        Tất cả
      </button>
      {ENTRY_TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => onType(t.value)}
          aria-pressed={type === t.value}
          className={chip(type === t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
