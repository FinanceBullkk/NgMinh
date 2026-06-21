"use client";

import { useState } from "react";
import type { SentimentOption } from "@/lib/types/models";

export function SentimentRow({
  option,
  canArchive,
  isFirst,
  isLast,
  disabled,
  onUpdate,
  onArchive,
  onMove,
}: {
  option: SentimentOption;
  canArchive: boolean;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (id: string, label: string, color: string) => void;
  onArchive: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(option.label);
  const [color, setColor] = useState(option.color);

  if (editing) {
    return (
      <li className="flex items-center gap-2">
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
          className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <button
          disabled={disabled || !label.trim()}
          onClick={() => {
            onUpdate(option.id, label.trim(), color);
            setEditing(false);
          }}
          className="text-xs text-[#3f8f6b]"
        >
          Lưu
        </button>
        <button
          onClick={() => {
            setLabel(option.label);
            setColor(option.color);
            setEditing(false);
          }}
          className="text-xs text-zinc-400"
        >
          Huỷ
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      <span
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: option.color }}
      />
      <span className="flex-1 text-sm">{option.label}</span>
      <button disabled={disabled || isFirst} onClick={() => onMove(option.id, -1)} className="text-xs disabled:opacity-30">
        ↑
      </button>
      <button disabled={disabled || isLast} onClick={() => onMove(option.id, 1)} className="text-xs disabled:opacity-30">
        ↓
      </button>
      <button disabled={disabled} onClick={() => setEditing(true)} className="text-xs text-zinc-500">
        Sửa
      </button>
      <button
        disabled={disabled || !canArchive}
        onClick={() => onArchive(option.id)}
        title={canArchive ? "" : "Phải còn ≥1 cảm nhận đang dùng"}
        className="text-xs text-zinc-400 disabled:opacity-30"
      >
        Lưu trữ
      </button>
    </li>
  );
}
