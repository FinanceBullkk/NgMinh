"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { fetchQuickAddData } from "@/lib/data/quick-add-client";
import { invalidate, prependEntryToFeed } from "@/lib/swr-revalidate";
import { createClient } from "@/lib/supabase/client";
import { todayInSaigon } from "@/lib/utils/today";
import type { EntryType, FeedEntry, SentimentOption } from "@/lib/types/models";
import { TypeButtonRow } from "./type-button-row";
import { SentimentButtonRow } from "./sentiment-button-row";

const todayISO = () => todayInSaigon(); // YYYY-MM-DD in Asia/Saigon (matches reads/nudges)

// Quick-add as a bottom sheet (mobile-first). On Profile: pass employeeId (preselected).
// Elsewhere: pass employees for a chip picker. `renderTrigger` lets a caller (e.g. the nav
// FAB) supply its own opener; default is a green button.
export function QuickAdd({
  employeeId,
  employees,
  sentiments,
  big,
  triggerLabel = "+ Ghi hôm nay",
  renderTrigger,
  cmdK,
  lazy,
}: {
  employeeId?: string;
  employees?: { id: string; name: string }[];
  sentiments?: SentimentOption[];
  big?: boolean;
  triggerLabel?: string;
  renderTrigger?: (open: () => void) => ReactNode;
  cmdK?: boolean;
  // lazy: fetch employees + sentiments on first open (global nav/sidebar quick-add) instead
  // of receiving them as props — keeps that data off every page navigation.
  lazy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [emp, setEmp] = useState("");
  const [date, setDate] = useState(""); // set on open() to avoid SSR/CSR mismatch
  const [showDate, setShowDate] = useState(false);
  const [type, setType] = useState<EntryType>("note");
  const [sentimentId, setSentimentId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  // Lazy-loaded data (only in lazy mode); falls back to props otherwise.
  const [loaded, setLoaded] = useState<{
    employees: { id: string; name: string }[];
    sentiments: SentimentOption[];
  } | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const effEmployees = loaded?.employees ?? employees;
  const effSentiments = loaded?.sentiments ?? sentiments ?? [];

  const focusContent = () =>
    setTimeout(() => contentRef.current?.focus(), 350); // after the slide-up

  const openSheet = () => {
    setDate(todayISO());
    setShowDate(false);
    setError("");
    setOpen(true);
    // Refetch on every open (keeps showing the previous list meanwhile) so newly added
    // employees appear without a reload.
    if (lazy && !loadingData) {
      setLoadingData(true);
      fetchQuickAddData()
        .then(setLoaded)
        .finally(() => setLoadingData(false));
    }
  };
  const closeSheet = () => setOpen(false);

  // Drive the native <dialog> from `open` state so the trigger callback never touches refs
  // during render; Esc/backdrop dismissal flows back through onClose → setOpen(false).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      focusContent();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const canSave = !!content.trim();

  // `again` = "Lưu & ghi tiếp": save, keep the sheet open, clear note/sentiment so the
  // manager can log the next person without reopening.
  const save = (again: boolean) => {
    const targetId = employeeId ?? emp;
    if (!targetId) return setError("Chọn nhân viên.");
    if (!content.trim()) return setError("Nhập nội dung.");
    const text = content.trim();
    const entryDate = date || todayISO();
    const sent = effSentiments.find((s) => s.id === sentimentId) ?? null;
    const who = effEmployees?.find((e) => e.id === targetId)?.name ?? "—";

    // Show the new note immediately in the Feed cache, then write it directly to Supabase
    // (browser→DB, fast) and reconcile. No slow server-action round-trip on the hot path.
    const optimistic: FeedEntry = {
      id: `tmp-${crypto.randomUUID()}`,
      user_id: "",
      employee_id: targetId,
      entry_date: entryDate,
      type,
      content: text,
      sentiment_id: sentimentId,
      created_at: new Date().toISOString(),
      employeeName: who,
      sentiment: sent ? { label: sent.label, color: sent.color } : null,
    };
    void prependEntryToFeed(optimistic);

    start(async () => {
      const { error: insErr } = await createClient().from("entries").insert({
        employee_id: targetId,
        entry_date: entryDate,
        type,
        content: text,
        sentiment_id: sentimentId,
      });
      if (insErr) {
        void invalidate.entry(); // roll the optimistic entry back
        return setError(insErr.message);
      }
      void invalidate.entry(); // reconcile feed/roster/profile with the real row
      if (again) {
        setContent("");
        setSentimentId(null);
        focusContent();
      } else {
        setContent("");
        setSentimentId(null);
        setType("note");
        closeSheet();
      }
    });
  };

  // ⌘/Ctrl + K opens quick-add from anywhere (desktop, spec: Web mocks).
  useEffect(() => {
    if (!cmdK) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        openSheet();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // openSheet is stable enough for this global hotkey; re-binding only on cmdK.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmdK]);

  // ⌘/Ctrl + Enter saves while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        save(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, content, emp, date, type, sentimentId]);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(openSheet)
      ) : (
        <button
          onClick={openSheet}
          className={
            big
              ? "w-full rounded-md bg-[#3f8f6b] px-4 py-3 font-medium text-white"
              : "rounded-md bg-[#3f8f6b] px-3 py-2 text-sm font-medium text-white"
          }
        >
          {triggerLabel}
        </button>
      )}

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false); // dismiss on backdrop tap
        }}
        className="sheet"
      >
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex justify-center pt-2.5 pb-0.5 lg:hidden">
            <span className="h-1.5 w-9 rounded-full bg-zinc-300" aria-hidden />
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto px-[18px] pb-[18px] pt-1.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Ghi hôm nay</h2>
              <button
                type="button"
                onClick={() => setShowDate((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[12.5px] text-zinc-600"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                </svg>
                {date === todayISO() ? "Hôm nay" : date}
              </button>
            </div>

            {showDate && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700"
              />
            )}

            {!employeeId && (
              <div>
                <div className="mb-1.5 text-xs font-semibold text-zinc-500">Nhân viên</div>
                <div className="flex flex-wrap gap-2">
                  {loadingData && !effEmployees && (
                    <span className="text-sm text-zinc-400">Đang tải…</span>
                  )}
                  {(effEmployees ?? []).map((e) => {
                    const on = emp === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setEmp(on ? "" : e.id)}
                        aria-pressed={on}
                        className={`rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium ${
                          on
                            ? "border-[#3f8f6b] bg-[#3f8f6b] text-white"
                            : "border-zinc-300 bg-white text-zinc-700"
                        }`}
                      >
                        {e.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Quan sát cụ thể (vd: 'trễ deadline X 2 lần') hơn nhãn cảm tính ('lười')."
              className="w-full resize-none rounded-xl border border-zinc-300 p-3 text-base leading-relaxed"
            />

            <div>
              <div className="mb-1.5 text-xs font-semibold text-zinc-500">Loại</div>
              <TypeButtonRow value={type} onChange={setType} />
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold text-zinc-500">Cảm nhận</div>
              <SentimentButtonRow sentiments={effSentiments} value={sentimentId} onChange={setSentimentId} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => save(true)}
                disabled={pending || !canSave}
                className="shrink-0 rounded-xl border border-zinc-300 px-3.5 py-3 text-sm font-semibold text-zinc-700 disabled:opacity-40"
              >
                Lưu &amp; ghi tiếp
              </button>
              <button
                type="button"
                onClick={() => save(false)}
                disabled={pending || !canSave}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3f8f6b] py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {pending ? "Đang lưu…" : "Lưu"}
                <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold" aria-hidden>
                  ⌘↵
                </span>
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
