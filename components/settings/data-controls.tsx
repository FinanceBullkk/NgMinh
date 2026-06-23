"use client";

import { useState, useTransition } from "react";
import { deleteAllData, deleteAccount } from "@/app/(app)/actions/data";
import { ConfirmDestructiveDialog } from "./confirm-destructive-dialog";

// DataControls: "Data" section with two-row card layout per spec.
// Row 1: Export JSON (neutral action).
// Row 2: Delete account (destructive, red, opens confirm dialog).
// Uses existing ConfirmDestructiveDialog — NOT window.confirm for destructive ops.
export function DataControls() {
  const [confirm, setConfirm] = useState<null | "all" | "account">(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const doDeleteAll = () =>
    start(async () => {
      const res = await deleteAllData();
      if (res?.error) return setMsg(res.error);
      setMsg("All employee data deleted.");
      setConfirm(null);
    });

  const doDeleteAccount = () =>
    start(async () => {
      const res = await deleteAccount(); // success → redirect to /login
      if (res?.error) setMsg(res.error);
    });

  return (
    <section className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[15px] font-bold">Data</h2>
        <p className="text-sm text-zinc-500">
          Your data is yours — always exportable or deletable.
        </p>
      </div>

      {msg && <p className="text-sm text-zinc-600">{msg}</p>}

      {/* White card: two rows divided by a separator */}
      <div className="overflow-hidden rounded-[14px] border border-[#e4e4e7] bg-white divide-y divide-[#e4e4e7]">

        {/* Row 1: Export data */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Export data</span>
            <span className="text-xs text-zinc-500">
              All employee data and notes as JSON.
            </span>
          </div>
          <a
            href="/settings/export"
            download
            className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Export JSON
          </a>
        </div>

        {/* Row 2: Delete account (destructive) */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-red-600">
              Delete all data
            </span>
            <span className="text-xs text-zinc-500">
              Permanently delete your account and all data. This cannot be undone.
            </span>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirm("account")}
            className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Confirm dialogs — rendered conditionally, use native <dialog> + type-to-confirm */}
      {confirm === "all" && (
        <ConfirmDestructiveDialog
          title="Delete all employee data"
          message="Every employee, note, goal and tag will be deleted. Your account and sentiment config are kept. This cannot be undone."
          confirmWord="DELETE ALL"
          confirmLabel="Delete all"
          pending={pending}
          onCancel={() => setConfirm(null)}
          onConfirm={doDeleteAll}
        />
      )}
      {confirm === "account" && (
        <ConfirmDestructiveDialog
          title="Delete account"
          message="Your entire account and all data will be permanently deleted. You will be signed out. This cannot be undone."
          confirmWord="DELETE ACCOUNT"
          confirmLabel="Delete account"
          pending={pending}
          onCancel={() => setConfirm(null)}
          onConfirm={doDeleteAccount}
        />
      )}
    </section>
  );
}
