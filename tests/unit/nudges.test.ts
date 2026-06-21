import { describe, expect, it } from "vitest";
import { computeNudges, hasNudge, type NudgeEntry } from "@/lib/utils/nudges";

const TODAY = "2026-06-21";
const e = (over: Partial<NudgeEntry>): NudgeEntry => ({
  type: "note",
  entry_date: TODAY,
  weight: null,
  ...over,
});

describe("computeNudges", () => {
  it("no entries → no nudges", () => {
    expect(computeNudges([], TODAY)).toEqual({ stale1on1: false, cooling: false });
  });

  it("active employee with no 1:1 ever → stale1on1", () => {
    expect(computeNudges([e({ type: "note" })], TODAY).stale1on1).toBe(true);
  });

  it("recent 1:1 (within 30d) → not stale", () => {
    expect(
      computeNudges([e({ type: "1:1", entry_date: "2026-06-10" })], TODAY).stale1on1,
    ).toBe(false);
  });

  it("old 1:1 (>30d) → stale", () => {
    expect(
      computeNudges([e({ type: "1:1", entry_date: "2026-04-01" })], TODAY).stale1on1,
    ).toBe(true);
  });

  it("recent weighted entries averaging negative → cooling", () => {
    const entries = [
      e({ entry_date: "2026-06-20", weight: -1 }),
      e({ entry_date: "2026-06-19", weight: -1 }),
      e({ entry_date: "2026-06-18", weight: 1 }),
    ];
    expect(computeNudges(entries, TODAY).cooling).toBe(true);
  });

  it("positive recent weights → not cooling", () => {
    const entries = [
      e({ entry_date: "2026-06-20", weight: 1 }),
      e({ entry_date: "2026-06-19", weight: 1 }),
    ];
    expect(computeNudges(entries, TODAY).cooling).toBe(false);
  });

  it("a single negative entry is not enough to be cooling", () => {
    expect(computeNudges([e({ weight: -1 })], TODAY).cooling).toBe(false);
  });

  it("hasNudge reflects either signal", () => {
    expect(hasNudge({ stale1on1: false, cooling: false })).toBe(false);
    expect(hasNudge({ stale1on1: true, cooling: false })).toBe(true);
  });
});
