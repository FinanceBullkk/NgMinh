"use client";

import { ENTRY_TYPES } from "@/lib/constants/entry-types";
import type { EntryType } from "@/lib/types/models";

export function TypeButtonRow({
  value,
  onChange,
}: {
  value: EntryType;
  onChange: (t: EntryType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ENTRY_TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            value === t.value
              ? "border-zinc-800 bg-zinc-800 text-white"
              : "border-zinc-300 text-zinc-600"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
