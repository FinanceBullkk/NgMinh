import Link from "next/link";
import { ENTRY_TYPE_LABEL } from "@/lib/constants/entry-types";
import type { TimelineEntry } from "@/lib/types/models";

// Reused by Profile (no employee) and Feed (employee link shown — cross-person).
export function TimelineEntryRow({
  entry,
  employee,
}: {
  entry: TimelineEntry;
  employee?: { id: string; name: string };
}) {
  return (
    <li className="flex gap-3 border-b border-zinc-100 py-3">
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: entry.sentiment?.color ?? "#d4d4d8" }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          {employee && (
            <Link
              href={`/employees/${employee.id}`}
              className="font-medium text-zinc-700 hover:underline"
            >
              {employee.name}
            </Link>
          )}
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600">
            {ENTRY_TYPE_LABEL[entry.type]}
          </span>
          <time dateTime={entry.entry_date}>{entry.entry_date}</time>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">
          {entry.content}
        </p>
      </div>
    </li>
  );
}
