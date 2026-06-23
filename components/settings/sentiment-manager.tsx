"use client";

import { useState, useTransition } from "react";
import { useSyncedState } from "@/lib/hooks/use-synced-state";
import type { SentimentOption } from "@/lib/types/models";
import {
  createSentiment,
  updateSentiment,
  reorderSentiment,
  archiveSentiment,
  unarchiveSentiment,
} from "@/app/(app)/actions/sentiment";
import { invalidate } from "@/lib/cache";
import { SentimentRow } from "./sentiment-row";
import { SentimentForm } from "./sentiment-form";

// Section title + gray description above every settings card.
function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <h2 className="text-[15px] font-bold">{title}</h2>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  );
}

// White card container with border + rounded-14.
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e4e4e7] bg-white">
      {children}
    </div>
  );
}

export function SentimentManager({ initial }: { initial: SentimentOption[] }) {
  const [items, setItems] = useSyncedState<SentimentOption[]>(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const active = items
    .filter((s) => !s.is_archived)
    .sort((a, b) => a.order_index - b.order_index || a.created_at.localeCompare(b.created_at));
  const archived = items.filter((s) => s.is_archived);

  const onCreate = (label: string, color: string, weight: number) =>
    start(async () => {
      const res = await createSentiment(label, color, weight);
      if ("error" in res) return setError(res.error);
      setItems((p) => [...p, res.option]);
      setError("");
      invalidate.sentiment();
    });

  const onUpdate = (id: string, label: string, color: string, weight: number) =>
    start(async () => {
      const res = await updateSentiment(id, label, color, weight);
      if (res.error) return setError(res.error);
      setItems((p) =>
        p.map((s) => (s.id === id ? { ...s, label, color, weight } : s)),
      );
      setError("");
      invalidate.sentiment();
    });

  const onArchive = (id: string) =>
    start(async () => {
      const res = await archiveSentiment(id);
      if (res.error) return setError(res.error);
      setItems((p) =>
        p.map((s) => (s.id === id ? { ...s, is_archived: true } : s)),
      );
      setError("");
      invalidate.sentiment();
    });

  const onUnarchive = (id: string) =>
    start(async () => {
      const res = await unarchiveSentiment(id);
      if (res.error) return setError(res.error);
      setItems((p) =>
        p.map((s) => (s.id === id ? { ...s, is_archived: false } : s)),
      );
      setError("");
      invalidate.sentiment();
    });

  // Up/down reorder — keep working without UI arrows (data integrity preserved).
  const onMove = (id: string, dir: -1 | 1) => {
    const idx = active.findIndex((s) => s.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= active.length) return;
    const reordered = [...active];
    [reordered[idx], reordered[swap]] = [reordered[swap], reordered[idx]];
    const ids = reordered.map((s) => s.id);
    setItems((p) =>
      p.map((s) => {
        const i = ids.indexOf(s.id);
        return i >= 0 ? { ...s, order_index: i } : s;
      }),
    );
    start(async () => {
      const res = await reorderSentiment(ids);
      if (res.error) setError(res.error);
      else invalidate.sentiment();
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="Mức cảm nhận"
        description="Mỗi mức có một nhãn + màu (màu chấm trên sparkline). Đánh dấu nó là Tiêu cực / Trung tính / Tích cực để app biết ai 'đang nguội' (gần đây toàn tiêu cực). 3 mức mặc định đã đặt đúng — thường không cần đổi."
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Active sentiments card: one row per item + add row at bottom */}
      <Card>
        <ul className="divide-y divide-[#e4e4e7]">
          {active.map((s, i) => (
            <SentimentRow
              key={s.id}
              option={s}
              canArchive={active.length > 1}
              isFirst={i === 0}
              isLast={i === active.length - 1}
              disabled={pending}
              onUpdate={onUpdate}
              onArchive={onArchive}
              onMove={onMove}
            />
          ))}
        </ul>
        {/* Add new sentiment row at the bottom of the card */}
        <div className="border-t border-[#e4e4e7]">
          <SentimentForm onSubmit={onCreate} disabled={pending} />
        </div>
      </Card>

      {/* Archived sentiments — only shown when at least one exists */}
      {archived.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            ĐÃ LƯU TRỮ · vẫn giữ màu cho lịch sử cũ
          </p>
          <ul className="flex flex-col gap-1">
            {archived.map((s) => (
              <li key={s.id} className="flex items-center gap-2 px-1 py-1">
                {/* Faded swatch */}
                <span
                  className="h-[18px] w-[18px] shrink-0 rounded-md opacity-50"
                  style={{ backgroundColor: s.color }}
                />
                {/* Line-through faded label */}
                <span className="flex-1 text-sm text-zinc-400 line-through">
                  {s.label}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onUnarchive(s.id)}
                  className="text-xs text-[#3f8f6b] hover:underline disabled:opacity-50"
                >
                  Khôi phục
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
