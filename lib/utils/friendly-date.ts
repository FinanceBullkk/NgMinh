// Friendly relative date label in Asia/Saigon (spec §7.3 vibe): for entry timelines.
// "Hôm nay" / "Hôm qua" / "N ngày trước" (within a week) / "28 Th5" (older).
function todayInSaigon(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Saigon" });
}

export function friendlyDate(date: string, today: string = todayInSaigon()): string {
  const diff = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
  );
  if (diff <= 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  if (diff < 7) return `${diff} ngày trước`;
  const [, m, dd] = date.split("-");
  return `${parseInt(dd, 10)} Th${parseInt(m, 10)}`;
}
