// Placeholder sparkline: colored dots by time (oldest → newest). The real, richer
// sparkline lands in Phase 7; colors already come from per-user sentiment config.
export function SparklineSlot({ colors }: { colors: string[] }) {
  if (colors.length === 0) {
    return <div className="h-3" aria-hidden />;
  }
  return (
    <svg
      width={colors.length * 6}
      height={12}
      role="img"
      aria-label="Diễn biến cảm nhận theo thời gian"
      className="overflow-visible"
    >
      {colors.map((c, i) => (
        <circle key={i} cx={i * 6 + 3} cy={6} r={2.5} fill={c} />
      ))}
    </svg>
  );
}
