"use client";

import { useEffect, useRef, useState } from "react";

// Mounted only while active (parent conditionally renders it) → showModal once on mount, no setState
// in the effect. Type-to-confirm gates the irreversible action; the server then enforces a recent
// re-authentication (audit H4 step-up) — handled by the parent's needsReauth flow.
export function ConfirmDestructiveDialog({
  title,
  message,
  confirmWord,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmWord: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      className="m-auto w-[min(92vw,28rem)] rounded-lg p-0 backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-3 p-5">
        <h2 className="text-lg font-semibold text-red-700">{title}</h2>
        <p className="text-sm text-zinc-600">{message}</p>
        <p className="text-sm">
          Gõ <code className="rounded bg-zinc-100 px-1">{confirmWord}</code> để xác nhận:
        </p>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 text-sm text-zinc-500">
            Huỷ
          </button>
          <button
            disabled={pending || typed !== confirmWord}
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Đang xoá…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
