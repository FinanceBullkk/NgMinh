"use client";

import { ENTRY_TYPES } from "@/lib/constants/entry-types";
import type { EntryType, Tag } from "@/lib/types/models";

// Dark chip for person/type (per design); green chip for tags to keep the dimension distinct.
const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors ${
    on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600"
  }`;

const tagChip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors ${
    on ? "border-[#3f8f6b] bg-[#3f8f6b] text-white" : "border-zinc-200 bg-white text-zinc-600"
  }`;

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function FeedFilters({
  employees,
  tags,
  person,
  onPerson,
  selectedTags,
  onToggleTag,
  onClearTags,
  selectedTypes,
  onToggleType,
  onClearTypes,
  filtering,
  scopeNote = true,
}: {
  employees: { id: string; name: string }[];
  tags: Tag[];
  person: string;
  onPerson: (id: string) => void;
  selectedTags: Set<string>;
  onToggleTag: (id: string) => void;
  onClearTags: () => void;
  selectedTypes: Set<EntryType>;
  onToggleType: (t: EntryType) => void;
  onClearTypes: () => void;
  filtering: boolean;
  // The "filters all data, not just the page" note is only accurate for the paginated List
  // view; the Calendar loads a whole bounded month, so the shell turns it off there.
  scopeNote?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Section label="Người">
        <button onClick={() => onPerson("")} aria-pressed={!person} className={chip(!person)}>
          Tất cả
        </button>
        {employees.map((e) => (
          <button
            key={e.id}
            onClick={() => onPerson(e.id)}
            aria-pressed={person === e.id}
            className={chip(person === e.id)}
          >
            {e.name}
          </button>
        ))}
      </Section>

      <Section label="Loại">
        <button
          onClick={onClearTypes}
          aria-pressed={selectedTypes.size === 0}
          className={chip(selectedTypes.size === 0)}
        >
          Tất cả
        </button>
        {ENTRY_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onToggleType(t.value)}
            aria-pressed={selectedTypes.has(t.value)}
            className={chip(selectedTypes.has(t.value))}
          >
            {t.label}
          </button>
        ))}
      </Section>

      {tags.length > 0 && (
        <Section label="Nhãn">
          <button
            onClick={onClearTags}
            aria-pressed={selectedTags.size === 0}
            className={tagChip(selectedTags.size === 0)}
          >
            Tất cả
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => onToggleTag(t.id)}
              aria-pressed={selectedTags.has(t.id)}
              className={tagChip(selectedTags.has(t.id))}
            >
              {t.name}
            </button>
          ))}
        </Section>
      )}

      {filtering && scopeNote && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-[#3f8f6b]">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Lọc trên toàn bộ dữ liệu, không chỉ phần đang hiển thị.
        </div>
      )}
    </div>
  );
}
