"use client";

import { useState } from "react";

// PRESET_COLORS mirrors sentiment-row.tsx palette — default to brand green.
const DEFAULT_COLOR = "#3f8f6b";

// PlusIcon: small inline + for the add-row trigger.
function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// SentimentForm: "+ Add sentiment" row that expands into label + submit.
// Lives inside the sentiment card (border-t separates from the list above).
// Polarity defaults to 0 (neutral) on create — user can edit after via inline row.
export function SentimentForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (label: string, color: string, weight: number) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState("");
  const [color] = useState(DEFAULT_COLOR);

  const handleSubmit = () => {
    if (!label.trim()) return;
    // Default weight = 0 (neutral). User adjusts in the row after creation.
    onSubmit(label.trim(), color, 0);
    setLabel("");
    setExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setLabel("");
      setExpanded(false);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-50"
      >
        <PlusIcon />
        Add sentiment
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* Color preview dot — uses default green; no picker needed at create time */}
      <span
        className="h-[26px] w-[26px] shrink-0 rounded-lg border border-black/10"
        style={{ backgroundColor: color }}
      />
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="New sentiment name…"
        aria-label="New sentiment name"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
      />
      <button
        type="button"
        disabled={disabled || !label.trim()}
        onClick={handleSubmit}
        className="shrink-0 rounded-md bg-zinc-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => {
          setLabel("");
          setExpanded(false);
        }}
        className="shrink-0 text-xs text-zinc-400 hover:text-zinc-600"
      >
        Cancel
      </button>
    </div>
  );
}
