"use client";

import { ENTRY_TYPES } from "@/lib/constants/entry-types";
import type { EntryType, Tag } from "@/lib/types/models";

export function FeedFilters({
  employees,
  tags,
  person,
  onPerson,
  selectedTags,
  onToggleTag,
  selectedTypes,
  onToggleType,
}: {
  employees: { id: string; name: string }[];
  tags: Tag[];
  person: string;
  onPerson: (id: string) => void;
  selectedTags: Set<string>;
  onToggleTag: (id: string) => void;
  selectedTypes: Set<EntryType>;
  onToggleType: (t: EntryType) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <select
        value={person}
        onChange={(e) => onPerson(e.target.value)}
        className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
      >
        <option value="">Mọi người</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2">
        {ENTRY_TYPES.map((t) => {
          const on = selectedTypes.has(t.value);
          return (
            <button
              key={t.value}
              onClick={() => onToggleType(t.value)}
              aria-pressed={on}
              className={`rounded-full border px-3 py-1 text-sm ${
                on ? "border-zinc-800 bg-zinc-800 text-white" : "border-zinc-300 text-zinc-600"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const on = selectedTags.has(t.id);
            return (
              <button
                key={t.id}
                onClick={() => onToggleTag(t.id)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1 text-sm ${
                  on ? "border-[#3f8f6b] bg-[#3f8f6b] text-white" : "border-zinc-300 text-zinc-600"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
