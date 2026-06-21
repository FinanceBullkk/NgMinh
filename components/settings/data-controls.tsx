"use client";

import { useState, useTransition } from "react";
import { deleteAllData, deleteAccount } from "@/app/(app)/actions/data";
import { ConfirmDestructiveDialog } from "./confirm-destructive-dialog";

export function DataControls() {
  const [confirm, setConfirm] = useState<null | "all" | "account">(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const doDeleteAll = () =>
    start(async () => {
      const res = await deleteAllData();
      if (res?.error) return setMsg(res.error);
      setMsg("Đã xoá toàn bộ dữ liệu nhân viên.");
      setConfirm(null);
    });

  const doDeleteAccount = () =>
    start(async () => {
      const res = await deleteAccount(); // success redirects to /login
      if (res?.error) setMsg(res.error);
    });

  return (
    <section className="flex flex-col items-start gap-3">
      <h2 className="text-sm font-medium">Dữ liệu</h2>

      <a
        href="/settings/export"
        download
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
      >
        ⬇ Export JSON
      </a>

      <button
        onClick={() => setConfirm("all")}
        className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600"
      >
        Xoá toàn bộ dữ liệu nhân viên
      </button>
      <button
        onClick={() => setConfirm("account")}
        className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600"
      >
        Xoá tài khoản (mọi thứ)
      </button>

      {msg && <p className="text-sm text-zinc-600">{msg}</p>}

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
