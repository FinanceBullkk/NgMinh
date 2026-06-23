import type { SentimentTrend } from "@/lib/utils/sentiment-trend";

// Plain-language read-out of the sparkline next to it: makes the sentiment feature's payoff
// self-evident. Semantic chrome colors (green/zinc/red) for stability regardless of the user's
// sentiment palette. When there isn't enough data, optionally invite the user to log more
// (shown on Profile, hidden on the compact Roster card).
const STATES: Record<
  Exclude<SentimentTrend, "insufficient">,
  { label: string; bg: string; fg: string }
> = {
  warm: { label: "Gần đây tích cực ↑", bg: "#e8f5ef", fg: "#2c6b50" },
  stable: { label: "Bình thường →", bg: "#f4f4f5", fg: "#52525b" },
  cool: { label: "Đang nguội ↓", bg: "#fde8e6", fg: "#b3392c" },
};

export function SentimentTrendChip({
  trend,
  showInvite = false,
}: {
  trend: SentimentTrend;
  showInvite?: boolean;
}) {
  if (trend === "insufficient") {
    return showInvite ? (
      <span className="text-xs text-zinc-400">Ghi cảm nhận để thấy xu hướng</span>
    ) : null;
  }
  const s = STATES[trend];
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
