// Friendly relative date label in Asia/Saigon (spec §7.3 vibe): for entry timelines.
// "Today" / "Yesterday" / "N days ago" (within a week) / "May 28" (older).
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function todayInSaigon(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Saigon" });
}

export function friendlyDate(date: string, today: string = todayInSaigon()): string {
  const diff = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
  );
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  const [, m, dd] = date.split("-");
  return `${SHORT_MONTHS[parseInt(m, 10) - 1]} ${parseInt(dd, 10)}`;
}
