import type { DayGroup } from "@/lib/utils/day-grouping";
import type { FeedEntry } from "@/lib/types/models";
import { TimelineEntryRow } from "@/components/profile/timeline-entry";

export function FeedDayGroup({ group }: { group: DayGroup<FeedEntry> }) {
  return (
    <section>
      <h2 className="sticky top-0 bg-white/90 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 backdrop-blur">
        {group.label}
      </h2>
      <ul className="flex flex-col">
        {group.items.map((e) => (
          <TimelineEntryRow
            key={e.id}
            entry={e}
            employee={{ id: e.employee_id, name: e.employeeName }}
          />
        ))}
      </ul>
    </section>
  );
}
