"use client";

import { useMemo, useState } from "react";
import type { Goal, TimelineEntry } from "@/lib/types/models";
import { buildReviewMarkdown } from "@/lib/utils/review-pack";

const todayISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Saigon" });
const daysAgoISO = (n: number) =>
  new Date(Date.parse(`${todayISO()}T00:00:00Z`) - n * 86_400_000)
    .toISOString()
    .slice(0, 10);

export function ReviewPack({
  employeeName,
  entries,
  goals,
}: {
  employeeName: string;
  entries: TimelineEntry[];
  goals: Goal[];
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(daysAgoISO(90));
  const [to, setTo] = useState(todayISO());
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(
    () => buildReviewMarkdown(employeeName, entries, goals, from, to),
    [employeeName, entries, goals, from, to],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — user can still select the textarea
    }
  };

  return (
    <section className="flex flex-col gap-2 p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="self-start rounded-md border border-zinc-300 px-3 py-2 text-sm"
      >
        {open ? "Hide review pack" : "Review pack"}
      </button>

      {open && (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-1">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded border border-zinc-300 px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-1">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded border border-zinc-300 px-2 py-1"
              />
            </label>
            <button
              onClick={copy}
              className="ml-auto rounded-md bg-[#3f8f6b] px-3 py-1 text-sm text-white"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <textarea
            readOnly
            value={markdown}
            rows={12}
            className="w-full resize-y rounded-md border border-zinc-300 p-3 font-mono text-xs"
          />
        </div>
      )}
    </section>
  );
}
