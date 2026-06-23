"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SentimentOption } from "@/lib/types/models";

// 8 preset colors for the swatch popover palette (spec "Web - Settings" mock).
const PRESET_COLORS = [
  "#3f8f6b", // brand green (positive)
  "#2a6f97", // blue
  "#9aa0a6", // gray (neutral)
  "#c45b4c", // red (negative)
  "#b5651d", // brown/orange
  "#7a5fb0", // purple
  "#c79a2e", // amber/gold
  "#4f8a8b", // teal
];

// Polarity (weight) segments — word labels so the meaning is obvious (was − / 0 / +).
const POLARITY_SEGMENTS = [
  { label: "Tiêu cực", value: -1, activeColor: "#c45b4c" },
  { label: "Trung tính", value: 0, activeColor: "#9aa0a6" },
  { label: "Tích cực", value: 1, activeColor: "#3f8f6b" },
] as const;

// ColorSwatchPopover: shows a 26×26px swatch button; click opens a 2×4 grid palette.
// Clicking a color selects it and closes. Outside-click closes.
function ColorSwatchPopover({
  color,
  onChange,
  disabled,
}: {
  color: string;
  onChange: (c: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape (keyboard-dismissible).
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      {/* Swatch button — 26px × 26px, rounded-lg (8px) per spec */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="Chọn màu"
        className="h-[26px] w-[26px] rounded-lg border border-black/10 disabled:opacity-50"
        style={{ backgroundColor: color }}
      />

      {open && (
        <div
          className="absolute left-0 top-8 z-20 grid grid-cols-4 gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
          role="dialog"
          aria-label="Bảng màu"
        >
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              aria-label={c}
              className="h-6 w-6 rounded-md border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                // Active color gets a ring to show selection.
                borderColor: c === color ? "#171717" : "transparent",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// PolarityControl: 3-segment button group "− / 0 / +" in one bordered rounded pill.
// Active segment is filled with its designated color; inactive = white bg + gray text.
function PolarityControl({
  weight,
  onChange,
  disabled,
}: {
  weight: number;
  onChange: (w: number) => void;
  disabled: boolean;
}) {
  return (
    <div
      className="flex overflow-hidden rounded-lg border border-zinc-300"
      role="group"
      aria-label="Độ phân cực"
    >
      {POLARITY_SEGMENTS.map((seg, i) => {
        const isActive = weight === seg.value;
        return (
          <button
            key={seg.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(seg.value)}
            aria-pressed={isActive}
            className={[
              "px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors disabled:opacity-50",
              i > 0 ? "border-l border-zinc-300" : "",
            ].join(" ")}
            style={
              isActive
                ? { backgroundColor: seg.activeColor, color: "#ffffff" }
                : { backgroundColor: "#ffffff", color: "#71717a" }
            }
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}

// ArchiveIcon: a box-archive SVG icon (Lucide-style, 16×16).
function ArchiveIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

// SentimentRow: inline edit — no separate edit mode.
// All fields (color swatch, label, polarity) are always editable; changes persist on
// blur/change via the parent's onUpdate callback. Archive fires onArchive.
export function SentimentRow({
  option,
  canArchive,
  disabled,
  onUpdate,
  onArchive,
}: {
  option: SentimentOption;
  canArchive: boolean;
  // isFirst / isLast kept for future reorder; not rendered in new UI.
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (id: string, label: string, color: string, weight: number) => void;
  onArchive: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  // Track previous prop values as state to detect changes from the parent (optimistic updates).
  // Pattern: store prev in state; when they diverge, update both prev and derived state in same
  // render (React docs "storing previous value" pattern — no effect needed).
  const [prevOptionLabel, setPrevOptionLabel] = useState(option.label);
  const [prevOptionColor, setPrevOptionColor] = useState(option.color);
  const [prevOptionWeight, setPrevOptionWeight] = useState(option.weight);
  const [label, setLabel] = useState(option.label);
  const [color, setColor] = useState(option.color);
  const [weight, setWeight] = useState(option.weight);

  if (prevOptionLabel !== option.label) {
    setPrevOptionLabel(option.label);
    setLabel(option.label);
  }
  if (prevOptionColor !== option.color) {
    setPrevOptionColor(option.color);
    setColor(option.color);
  }
  if (prevOptionWeight !== option.weight) {
    setPrevOptionWeight(option.weight);
    setWeight(option.weight);
  }

  const persist = useCallback(
    (l: string, c: string, w: number) => {
      if (l.trim()) onUpdate(option.id, l.trim(), c, w);
    },
    [option.id, onUpdate],
  );

  const handleColorChange = (c: string) => {
    setColor(c);
    persist(label, c, weight);
  };

  const handleWeightChange = (w: number) => {
    setWeight(w);
    persist(label, color, w);
  };

  const handleLabelBlur = () => {
    if (label.trim() && label.trim() !== option.label) {
      persist(label, color, weight);
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-2 px-3 py-2">
      {/* Color swatch → popover palette */}
      <ColorSwatchPopover
        color={color}
        onChange={handleColorChange}
        disabled={disabled}
      />

      {/* Inline label input — transparent background, grows to fill space */}
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={handleLabelBlur}
        aria-label="Tên cảm nhận"
        className="min-w-[110px] flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 focus:underline"
      />

      {/* 3-segment polarity control */}
      <PolarityControl
        weight={weight}
        onChange={handleWeightChange}
        disabled={disabled}
      />

      {/* Archive icon button */}
      <button
        type="button"
        disabled={disabled || !canArchive}
        onClick={() => onArchive(option.id)}
        title={
          canArchive
            ? "Lưu trữ cảm nhận này"
            : "Phải còn ít nhất 1 cảm nhận đang dùng"
        }
        className="shrink-0 text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-30"
        aria-label="Lưu trữ"
      >
        <ArchiveIcon />
      </button>
    </li>
  );
}
