"use client";

import { useState, useTransition } from "react";
import { deleteAllData, deleteAccount } from "@/app/(app)/actions/data";
import { startGoogleSignIn } from "@/lib/auth/oauth-client";
import { ConfirmDestructiveDialog } from "./confirm-destructive-dialog";

// DataControls: "Dữ liệu" section. Export JSON (neutral) + two destructive rows: delete employee
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
      setMsg("Đã xoá toàn bộ dữ liệu nhân viên.");
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
        <h2 className="text-[15px] font-bold">Dữ liệu</h2>
        <p className="text-sm text-zinc-500">
          Dữ liệu là của riêng bạn — luôn xuất ra hoặc xoá được.
        </p>
      </div>

      {msg && <p className="text-sm text-zinc-600">{msg}</p>}

      {needsReauth && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            Vì an toàn, hãy đăng nhập lại để xác nhận thao tác xoá, rồi thử lại.
          </p>
          <button
            type="button"
            onClick={() => startGoogleSignIn({ reauth: true, next: "/settings" })}
            className="self-start rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Đăng nhập lại với Google
          </button>
        </div>
      )}

      {/* White card: two rows divided by a separator */}
      <div className="overflow-hidden rounded-[14px] border border-[#e4e4e7] bg-white divide-y divide-[#e4e4e7]">

        {/* Row 1: Export data */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Xuất dữ liệu</span>
            <span className="text-xs text-zinc-500">
              Toàn bộ dữ liệu nhân viên và ghi chú dưới dạng JSON.
            </span>
          </div>
          <a
            href="/settings/export"
            download
            className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Xuất JSON
          </a>
        </div>

        {/* Row 2: Delete employee data only (keep account + sentiment config) */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-red-600">
              Xoá dữ liệu nhân viên
            </span>
            <span className="text-xs text-zinc-500">
              Xoá mọi nhân viên, note, goal và tag. Tài khoản và cấu hình cảm nhận được giữ lại.
            </span>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirm("all")}
            className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Xoá dữ liệu
          </button>
        </div>

        {/* Row 3: Delete account (destructive — wipes everything) */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-red-600">
              Xoá tài khoản
            </span>
            <span className="text-xs text-zinc-500">
              Xoá tài khoản và mọi dữ liệu vĩnh viễn. Không thể hoàn tác.
            </span>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirm("account")}
            className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Xoá tài khoản
          </button>
        </div>
      </div>

      {/* Confirm dialogs — rendered conditionally, use native <dialog> + type-to-confirm */}
      {confirm === "all" && (
        <ConfirmDestructiveDialog
          title="Xoá toàn bộ dữ liệu nhân viên"
          message="Mọi nhân viên, note, goal và tag sẽ bị xoá. Tài khoản và cấu hình cảm nhận được giữ lại. Không thể hoàn tác."
          confirmWord="XOA HET"
          confirmLabel="Xoá hết"
          pending={pending}
          onCancel={() => setConfirm(null)}
          onConfirm={doDeleteAll}
        />
      )}
      {confirm === "account" && (
        <ConfirmDestructiveDialog
          title="Xoá tài khoản"
          message="Toàn bộ tài khoản và dữ liệu sẽ bị xoá vĩnh viễn. Bạn sẽ bị đăng xuất. Không thể hoàn tác."
          confirmWord="XOA TAI KHOAN"
          confirmLabel="Xoá tài khoản"
          pending={pending}
          onCancel={() => setConfirm(null)}
          onConfirm={doDeleteAccount}
        />
      )}
    </section>
  );
}
