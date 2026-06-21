"use client";

import { useState } from "react";
import { WEIGHT_OPTIONS } from "@/lib/constants/sentiment-weight";

export function SentimentForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (label: string, color: string, weight: number) => void;
  disabled: boolean;
}) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#3f8f6b");
  const [weight, setWeight] = useState(0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        aria-label="Màu"
        className="h-8 w-8 rounded border border-zinc-300"
      />
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Tên cảm nhận mới…"
        className="min-w-32 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
      />
      <select
        value={weight}
        onChange={(e) => setWeight(Number(e.target.value))}
        aria-label="Cực"
        className="rounded border border-zinc-300 px-2 py-1 text-sm"
      >
        {WEIGHT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        disabled={disabled || !label.trim()}
        onClick={() => {
          onSubmit(label.trim(), color, weight);
          setLabel("");
          setColor("#3f8f6b");
          setWeight(0);
        }}
        className="rounded-md bg-zinc-800 px-3 py-1 text-sm text-white disabled:opacity-50"
      >
        Thêm
      </button>
    </div>
  );
}
