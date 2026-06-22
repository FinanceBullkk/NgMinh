// Single definition of "today" in the app's fixed timezone (Asia/Saigon), as YYYY-MM-DD.
// Used by every read/write/grouping/nudge so day boundaries always agree.
export function todayInSaigon(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Saigon" });
}
