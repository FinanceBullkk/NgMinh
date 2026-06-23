// Hand-rendered SVG sparkline (spec §8) — NO chart library. Pure, server-safe.
// `colors` is ordered oldest → newest; recent dot sits on the right.
export function SentimentSparkline({
  colors,
  dot = 5,
  gap = 3,
  height = 14,
}: {
  colors: string[];
  dot?: number;
  gap?: number;
  height?: number;
}) {
  if (colors.length === 0) {
    return <div style={{ height }} aria-hidden />;
  }
  const r = dot / 2;
  const step = dot + gap;
  const width = colors.length * step - gap;
  const cy = height / 2;

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`Sentiment over time: ${colors.length} entries`}
      className="overflow-visible"
    >
      <line x1={r} y1={cy} x2={width - r} y2={cy} stroke="#e4e4e7" strokeWidth={1} />
      {colors.map((c, i) => (
        <circle key={i} cx={i * step + r} cy={cy} r={r} fill={c} />
      ))}
    </svg>
  );
}
