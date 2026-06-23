"use client";

import { useState, useTransition } from "react";
import { deleteEntry } from "@/app/(app)/actions/entries";
import { invalidate } from "@/lib/cache";

// Profile-only: remove a mis-entered timeline entry (with confirm). Append-only still
// forbids editing content — this deletes the whole row, it never overwrites it.
export function DeleteEntryButton({
  entryId,
  employeeId,
}: {
  entryId: string;
  employeeId: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const onClick = () => {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    start(async () => {
      const res = await deleteEntry(entryId, employeeId);
      if (res?.error) return setErr(res.error); // surface the failure; do NOT invalidate (row stays)
      setErr("");
      void invalidate.entry();
    });
  };
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5">
      {err && <span className="text-xs text-red-600">{err}</span>}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label="Delete entry"
        className="flex items-center p-1 text-zinc-300 hover:text-red-500 disabled:opacity-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </span>
  );
}
