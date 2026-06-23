"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SentimentOption } from "@/lib/types/models";
import { PolarityControl } from "./polarity-control";
import { isSelfEvidentLabel, selfEvidentPolarity } from "@/lib/utils/sentiment-polarity";

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

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      {/* Swatch button — 26px × 26px, rounded-lg (8px) per spec */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose color"
        className="h-[26px] w-[26px] rounded-lg border border-black/10 disabled:opacity-50"
        style={{ backgroundColor: color }}
      />

      {open && (
        <div
          className="absolute left-0 top-8 z-20 grid grid-cols-4 gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
          role="dialog"
          aria-label="Color palette"
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

// PencilIcon: a faint edit affordance inside the name field so it reads as editable (mobile too).
function PencilIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
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
    const trimmed = label.trim();
    if (!trimmed || trimmed === option.label) return;
    // Renaming to a self-evident label (e.g. "Positive") fixes its polarity automatically and
    // hides the control; renaming to a custom name keeps the current weight (now editable).
    const implied = selfEvidentPolarity(trimmed);
    const nextWeight = implied ?? weight;
    if (nextWeight !== weight) setWeight(nextWeight);
    persist(trimmed, color, nextWeight);
  };

  return (
    <li className="flex flex-wrap items-center gap-2 px-3 py-2">
      {/* Color swatch → popover palette */}
      <ColorSwatchPopover
        color={color}
        onChange={handleColorChange}
        disabled={disabled}
      />

      {/* Inline label field — styled as an editable input (border + pencil) so it's obviously
          tappable to rename, on mobile too. Saves on blur. */}
      <div className="relative min-w-[110px] flex-1">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleLabelBlur}
          aria-label="Sentiment name"
          placeholder="Name"
          className="w-full rounded-md border border-zinc-200 bg-white py-1 pl-2 pr-7 text-sm text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-[#3f8f6b] focus:ring-2 focus:ring-[#3f8f6b]/20"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300">
          <PencilIcon />
        </span>
      </div>

      {/* Polarity only matters when the name doesn't already reveal direction — so the default
          Positive/Neutral/Negative rows show nothing, and only custom names get the control. */}
      {!isSelfEvidentLabel(label) && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400">Counts as</span>
          <PolarityControl weight={weight} onChange={handleWeightChange} disabled={disabled} />
        </div>
      )}

      {/* Archive icon button */}
      <button
        type="button"
        disabled={disabled || !canArchive}
        onClick={() => onArchive(option.id)}
        title={
          canArchive
            ? "Archive this sentiment"
            : "At least 1 sentiment must stay in use"
        }
        className="shrink-0 text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-30"
        aria-label="Archive"
      >
        <ArchiveIcon />
      </button>
    </li>
  );
}
