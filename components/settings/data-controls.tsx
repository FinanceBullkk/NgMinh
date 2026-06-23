"use client";

import { useState, useTransition } from "react";
import { deleteAllData, deleteAccount } from "@/app/(app)/actions/data";
import { startGoogleSignIn } from "@/lib/auth/oauth-client";
import { ConfirmDestructiveDialog } from "./confirm-destructive-dialog";

// DataControls: "Data" section. Export JSON (neutral) + two destructive rows: delete employee
// data only (keeps account + sentiment config) and delete the whole account. Both open a
// type-to-confirm dialog and are step-up gated server-side (audit H4): if the session is not
// freshly authenticated, the action returns needsReauth and we prompt a fresh Google login first.
export function DataControls() {
  const [confirm, setConfirm] = useState<null | "all" | "account">(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [needsReauth, setNeedsReauth] = useState(false);

  const doDeleteAll = () =>
    start(async () => {
      const res = await deleteAllData();
      if (res?.needsReauth) return (setConfirm(null), setNeedsReauth(true));
      if (res?.error) return setMsg(res.error);
      setMsg("All employee data deleted.");
      setConfirm(null);
    });

  const doDeleteAccount = () =>
    start(async () => {
      const res = await deleteAccount(); // success → redirect to /login
      if (res?.needsReauth) return (setConfirm(null), setNeedsReauth(true));
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

      {needsReauth && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            For your security, please sign in again to confirm the deletion, then retry.
          </p>
          <button
            type="button"
            onClick={() => startGoogleSignIn({ reauth: true, next: "/settings" })}
            className="self-start rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Sign in again with Google
          </button>
        </div>
      )}

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

        {/* Row 2: Delete employee data only (keep account + sentiment config) */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-red-600">
              Delete employee data
            </span>
            <span className="text-xs text-zinc-500">
              Delete every employee, note, goal and tag. Your account and sentiment config are kept.
            </span>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirm("all")}
            className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Delete data
          </button>
        </div>

        {/* Row 3: Delete account (destructive — wipes everything) */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-red-600">
              Delete account
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
