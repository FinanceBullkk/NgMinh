"use client";

import { useTransition } from "react";
import { deleteEntry } from "@/app/(app)/actions/entries";
import { revalidateAfterEntryWrite } from "@/lib/swr-revalidate";

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
  const onClick = () => {
    if (!window.confirm("Xoá ghi nhận này? Không thể hoàn tác.")) return;
    start(async () => {
      await deleteEntry(entryId, employeeId);
      void revalidateAfterEntryWrite();
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label="Xoá ghi nhận"
      className="ml-auto flex shrink-0 items-center p-1 text-zinc-300 hover:text-red-500 disabled:opacity-50"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    </button>
  );
}
