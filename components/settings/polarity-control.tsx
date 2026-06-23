"use client";

// 3-segment polarity picker — "how does this sentiment COUNT for the cooling/trend math".
// Shared by the sentiment row (custom labels only) and the add-sentiment form. Self-evident
// labels (Positive/Neutral/Negative) never show this; see lib/utils/sentiment-polarity.
const POLARITY_SEGMENTS = [
  { label: "Negative", value: -1, activeColor: "#c45b4c" },
  { label: "Neutral", value: 0, activeColor: "#9aa0a6" },
  { label: "Positive", value: 1, activeColor: "#3f8f6b" },
] as const;

export function PolarityControl({
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
      aria-label="Counts as"
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
