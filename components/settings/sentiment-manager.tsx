"use client";

import { useState, useTransition } from "react";
import type { SentimentOption } from "@/lib/types/models";
import {
  createSentiment,
  updateSentiment,
  reorderSentiment,
  archiveSentiment,
  unarchiveSentiment,
} from "@/app/(app)/actions/sentiment";
import { SentimentRow } from "./sentiment-row";
import { SentimentForm } from "./sentiment-form";

export function SentimentManager({ initial }: { initial: SentimentOption[] }) {
  const [items, setItems] = useState<SentimentOption[]>(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const active = items
    .filter((s) => !s.is_archived)
    .sort((a, b) => a.order_index - b.order_index);
  const archived = items.filter((s) => s.is_archived);

  const onCreate = (label: string, color: string, weight: number) =>
    start(async () => {
      const res = await createSentiment(label, color, weight);
      if ("error" in res) return setError(res.error);
      setItems((p) => [...p, res.option]);
      setError("");
    });

  const onUpdate = (id: string, label: string, color: string, weight: number) =>
    start(async () => {
      const res = await updateSentiment(id, label, color, weight);
      if (res.error) return setError(res.error);
      setItems((p) => p.map((s) => (s.id === id ? { ...s, label, color, weight } : s)));
      setError("");
    });

  const onArchive = (id: string) =>
    start(async () => {
      const res = await archiveSentiment(id);
      if (res.error) return setError(res.error);
      setItems((p) => p.map((s) => (s.id === id ? { ...s, is_archived: true } : s)));
      setError("");
    });

  const onUnarchive = (id: string) =>
    start(async () => {
      const res = await unarchiveSentiment(id);
      if (res.error) return setError(res.error);
      setItems((p) => p.map((s) => (s.id === id ? { ...s, is_archived: false } : s)));
      setError("");
    });

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
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Cảm nhận (sentiment)</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="flex flex-col gap-2">
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
      <SentimentForm onSubmit={onCreate} disabled={pending} />

      {archived.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-zinc-500">
            Đã lưu trữ ({archived.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {archived.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-zinc-500 line-through">{s.label}</span>
                <button
                  disabled={pending}
                  onClick={() => onUnarchive(s.id)}
                  className="text-xs text-[#3f8f6b]"
                >
                  Khôi phục
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
