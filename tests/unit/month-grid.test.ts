import { describe, expect, it } from "vitest";
import {
  buildMonthMatrix,
  monthLabel,
  monthOf,
  monthRange,
  shiftMonth,
} from "@/lib/utils/month-grid";

describe("monthOf", () => {
  it("takes the YYYY-MM prefix", () => {
    expect(monthOf("2026-06-23")).toBe("2026-06");
  });
});

describe("monthRange", () => {
  it("spans the whole month (31-day)", () => {
    expect(monthRange("2026-07")).toEqual({ start: "2026-07-01", end: "2026-07-31" });
  });
  it("handles February in a non-leap year", () => {
    expect(monthRange("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });
  it("handles February in a leap year", () => {
    expect(monthRange("2024-02")).toEqual({ start: "2024-02-01", end: "2024-02-29" });
  });
});

describe("shiftMonth", () => {
  it("steps forward across a year boundary", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
  it("steps backward across a year boundary", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
  it("is identity for 0 and reversible", () => {
    expect(shiftMonth("2026-06", 0)).toBe("2026-06");
    expect(shiftMonth(shiftMonth("2026-06", 5), -5)).toBe("2026-06");
  });
});

describe("monthLabel", () => {
  it("renders the month heading", () => {
    expect(monthLabel("2026-06")).toBe("June 2026");
  });
});

describe("buildMonthMatrix", () => {
  it("always returns 42 cells (6×7)", () => {
    expect(buildMonthMatrix("2026-06", "2026-06-23")).toHaveLength(42);
  });

  it("starts on a Monday and ends on a Sunday", () => {
    const cells = buildMonthMatrix("2026-06", "2026-06-23");
    // 2026-06-01 is a Monday → no leading filler.
    expect(cells[0].date).toBe("2026-06-01");
    expect(cells[0].inMonth).toBe(true);
    // Last cell is in the trailing week (next month).
    expect(cells[41].date).toBe("2026-07-12");
    expect(cells[41].inMonth).toBe(false);
  });

  it("adds leading filler from the previous month", () => {
    // 2026-07-01 is a Wednesday → Mon 06-29, Tue 06-30 lead in.
    const cells = buildMonthMatrix("2026-07", "2026-07-01");
    expect(cells[0]).toMatchObject({ date: "2026-06-29", inMonth: false });
    expect(cells[1]).toMatchObject({ date: "2026-06-30", inMonth: false });
    expect(cells[2]).toMatchObject({ date: "2026-07-01", inMonth: true, isToday: true });
  });

  it("flags exactly the one matching today, and only inside its month", () => {
    const cells = buildMonthMatrix("2026-06", "2026-06-23");
    expect(cells.filter((c) => c.isToday)).toHaveLength(1);
    const today = cells.find((c) => c.isToday)!;
    expect(today.date).toBe("2026-06-23");
    expect(today.inMonth).toBe(true);
  });

  it("has no today flag when today is in another month", () => {
    const cells = buildMonthMatrix("2026-06", "2026-08-01");
    expect(cells.some((c) => c.isToday)).toBe(false);
  });

  it("contains every day of the month exactly once", () => {
    const cells = buildMonthMatrix("2026-02", "2026-02-15");
    const inMonth = cells.filter((c) => c.inMonth).map((c) => c.date);
    expect(inMonth).toHaveLength(28);
    expect(new Set(inMonth).size).toBe(28);
    expect(inMonth[0]).toBe("2026-02-01");
    expect(inMonth[27]).toBe("2026-02-28");
  });
});
