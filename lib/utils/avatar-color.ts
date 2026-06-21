// Deterministic avatar color per person. Employees have no color column, so derive a
// stable color from a seed (the employee id). Kept OFF the sentiment palette so an
// avatar never reads as a sentiment dot.
const PALETTE = [
  "#3f8f6b", "#2a6f97", "#b5651d", "#7c5cbf",
  "#c0567a", "#4f8a8b", "#a8743a", "#5a6cc4",
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// First letter for the avatar badge (Vietnamese names included, e.g. "Bình" → "B").
export function avatarInitial(name: string): string {
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() : "—";
}
