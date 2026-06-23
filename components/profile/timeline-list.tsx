"use client";

import { useMemo, useState } from "react";
import type { EntryType, TimelineEntry } from "@/lib/types/models";
import { TimelineEntryRow } from "./timeline-entry";
import { TimelineFilters } from "./timeline-filters";

export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  const [type, setType] = useState<EntryType | "">("");

  const visible = useMemo(
    () => entries.filter((e) => !type || e.type === type),
    [entries, type],
  );

  return (
    <section className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Timeline</h2>
        <span className="text-xs text-zinc-400">{visible.length} entries</span>
      </div>
      <TimelineFilters type={type} onType={setType} />
      <ul className="flex flex-col">
        {visible.map((e) => (
          // Profile = single person → no avatar/name (left sentiment dot); rows are deletable.
          <TimelineEntryRow key={e.id} entry={e} deletable />
        ))}
        {visible.length === 0 && (
          <li className="py-6 text-center text-xs text-zinc-400">No entries yet.</li>
        )}
      </ul>
    </section>
  );
}
