import Link from "next/link";
import { ENTRY_TYPE_LABEL } from "@/lib/constants/entry-types";
import type { TimelineEntry } from "@/lib/types/models";
import { avatarColor, avatarInitial } from "@/lib/utils/avatar-color";
import { friendlyDate } from "@/lib/utils/friendly-date";
import { DeleteEntryButton } from "./delete-entry-button";

// Reused by Profile (no employee) and Feed (cross-person: shows avatar + employee link).
// Feed:    [avatar]   name · type · (dot+label) · date
// Profile: [sent dot] type · label · date · [delete]   (delete only when `deletable`)
export function TimelineEntryRow({
  entry,
  employee,
  deletable,
}: {
  entry: TimelineEntry;
  employee?: { id: string; name: string };
  deletable?: boolean;
}) {
  const sentiment = entry.sentiment;
  return (
    <li className="flex gap-3 border-b border-zinc-100 py-3">
      {employee ? (
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: avatarColor(employee.id) }}
          aria-hidden
        >
          {avatarInitial(employee.name)}
        </span>
      ) : (
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: sentiment?.color ?? "#d4d4d8" }}
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {employee && (
            <Link
              href={`/employees/${employee.id}`}
              className="text-[13px] font-semibold text-zinc-900 hover:underline"
            >
              {employee.name}
            </Link>
          )}
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-zinc-600">
            {ENTRY_TYPE_LABEL[entry.type]}
          </span>
          {sentiment &&
            (employee ? (
              <span
                className="inline-flex items-center gap-1 whitespace-nowrap font-semibold"
                style={{ color: sentiment.color }}
              >
                <span
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ backgroundColor: sentiment.color }}
                  aria-hidden
                />
                {sentiment.label}
              </span>
            ) : (
              <span className="whitespace-nowrap font-semibold" style={{ color: sentiment.color }}>
                {sentiment.label}
              </span>
            ))}
          <time
            dateTime={entry.entry_date}
            className={`whitespace-nowrap text-zinc-400 ${deletable ? "" : "ml-auto"}`}
          >
            {friendlyDate(entry.entry_date)}
          </time>
          {deletable && (
            <DeleteEntryButton entryId={entry.id} employeeId={entry.employee_id} />
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
          {entry.content}
        </p>
      </div>
    </li>
  );
}
