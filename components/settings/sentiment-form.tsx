"use client";

import { useState } from "react";

export function SentimentForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (label: string, color: string) => void;
  disabled: boolean;
}) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#3f8f6b");

  return (
    <div className="flex items-center gap-2">
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
        className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
      />
      <button
        disabled={disabled || !label.trim()}
        onClick={() => {
          onSubmit(label.trim(), color);
          setLabel("");
          setColor("#3f8f6b");
        }}
        className="rounded-md bg-zinc-800 px-3 py-1 text-sm text-white disabled:opacity-50"
      >
        Thêm
      </button>
    </div>
  );
}
