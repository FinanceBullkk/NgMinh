"use client";

import type { Tag } from "@/lib/types/models";

// Multi-select chips. Filtering is OR / any-match for discoverability (spec §7.1).
export function TagFilterBar({
  tags,
  selected,
  onToggle,
}: {
  tags: Tag[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const on = selected.has(t.id);
        return (
          <button
            key={t.id}
            onClick={() => onToggle(t.id)}
            aria-pressed={on}
            className={`rounded-full border px-3 py-1 text-sm ${
              on
                ? "border-[#3f8f6b] bg-[#3f8f6b] text-white"
                : "border-zinc-300 text-zinc-600"
            }`}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
