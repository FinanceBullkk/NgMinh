// Month-grid math for the Calendar view (by-time axis, rendered as a grid). Pure & unit-testable.
//
// TIMEZONE NOTE (don't "fix" this to use Asia/Saigon): this module never reads a *timestamp* in a
// timezone — it does calendar-date-string arithmetic. Dates are anchored at UTC midnight and
// stepped by whole days, then formatted with toISOString().slice(0,10), so a cell is the literal
// calendar string e.g. "2026-06-23". It is compared against entry_date and todayInSaigon(), which
// are ALSO 'YYYY-MM-DD' calendar strings — string-to-string, no drift. Same drift-free technique
// day-grouping.ts uses. A "month" is a 'YYYY-MM' string; no Date objects leak out.

const MS_DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

function parseMonth(month: string): { y: number; m: number } {
  const [y, m] = month.split("-").map(Number);
  return { y, m }; // m is 1-12
}

// A single cell in the 6×7 grid.
export type MonthDay = {
  date: string; // YYYY-MM-DD
  day: number; // 1..31
  inMonth: boolean; // false for leading/trailing filler from adjacent months
  isToday: boolean;
};

// 'YYYY-MM' for any 'YYYY-MM-DD'.
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

// First and last calendar dates of the month, inclusive — the range for the DB query.
export function monthRange(month: string): { start: string; end: string } {
  const { y, m } = parseMonth(month);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate(); // day 0 of next month = last day
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, "0")}` };
}

// Shift a month by ±n months (handles year boundaries).
export function shiftMonth(month: string, delta: number): string {
  const { y, m } = parseMonth(month);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

// Vietnamese month heading, e.g. "Tháng 6 2026".
export function monthLabel(month: string): string {
  const { y, m } = parseMonth(month);
  return `Tháng ${m} ${y}`;
}

// A stable 42-cell (6 weeks × 7 days) Monday-first matrix covering `month`, with leading days
// from the previous month and trailing days from the next so the grid height never jumps.
export function buildMonthMatrix(month: string, today: string): MonthDay[] {
  const { y, m } = parseMonth(month);
  const first = Date.UTC(y, m - 1, 1);
  const lead = (new Date(first).getUTCDay() + 6) % 7; // days before the 1st (Mon=0 … Sun=6)
  const startMs = first - lead * MS_DAY;
  return Array.from({ length: 42 }, (_, i) => {
    const ms = startMs + i * MS_DAY;
    const date = iso(ms);
    return {
      date,
      day: new Date(ms).getUTCDate(),
      inMonth: date.slice(0, 7) === month,
      isToday: date === today,
    };
  });
}
