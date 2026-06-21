"use client";

import { useRef, useState, useTransition } from "react";
import { createEntry } from "@/app/(app)/actions/entries";
import type { EntryType, SentimentOption } from "@/lib/types/models";
import { TypeButtonRow } from "./type-button-row";
import { SentimentButtonRow } from "./sentiment-button-row";

const todayISO = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local

// Shared quick-add. On Profile: pass employeeId (preselected). Elsewhere: pass
// employees for a picker. Optimized for speed — autofocus content, single save tap.
export function QuickAdd({
  employeeId,
  employees,
  sentiments,
  big,
  triggerLabel = "+ Ghi hôm nay",
}: {
  employeeId?: string;
  employees?: { id: string; name: string }[];
  sentiments: SentimentOption[];
  big?: boolean;
  triggerLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [emp, setEmp] = useState("");
  const [date, setDate] = useState(""); // set on open() to avoid SSR/CSR mismatch
  const [type, setType] = useState<EntryType>("note");
  const [sentimentId, setSentimentId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const open = () => {
    setDate(todayISO());
    setError("");
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();

  const submit = () => {
    const targetId = employeeId ?? emp;
    if (!targetId) return setError("Chọn nhân viên.");
    if (!content.trim()) return setError("Nhập nội dung.");
    start(async () => {
      const res = await createEntry({
        employeeId: targetId,
        entry_date: date,
        type,
        content: content.trim(),
        sentiment_id: sentimentId,
      });
      if (res.error) return setError(res.error);
      setContent("");
      setSentimentId(null);
      setType("note");
      close();
    });
  };

  return (
    <>
      <button
        onClick={open}
        className={
          big
            ? "w-full rounded-md bg-[#3f8f6b] px-4 py-3 font-medium text-white"
            : "rounded-md bg-[#3f8f6b] px-3 py-2 text-sm font-medium text-white"
        }
      >
        {triggerLabel}
      </button>

      <dialog
        ref={ref}
        onClose={close}
        className="m-auto w-[min(92vw,32rem)] rounded-lg p-0 backdrop:bg-black/40"
      >
        <div className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold">Ghi hôm nay</h2>

          {!employeeId && employees && (
            <select
              value={emp}
              onChange={(e) => setEmp(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2"
            >
              <option value="">— Chọn nhân viên —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}

          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Quan sát cụ thể (vd: 'trễ deadline X 2 lần') hơn nhãn cảm tính ('lười')."
            className="w-full resize-y rounded-md border border-zinc-300 p-3 text-base"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <TypeButtonRow value={type} onChange={setType} />
          <SentimentButtonRow
            sentiments={sentiments}
            value={sentimentId}
            onChange={setSentimentId}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button onClick={close} className="px-3 py-2 text-sm text-zinc-500">
              Huỷ
            </button>
            <button
              onClick={submit}
              disabled={pending}
              className="rounded-md bg-[#3f8f6b] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
