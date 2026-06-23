import { describe, expect, it } from "vitest";
import { buildDayRibbon, NEUTRAL_COLOR } from "@/lib/utils/day-ribbon";

const e = (color: string | null) => ({ sentiment: color ? { color } : null });

describe("buildDayRibbon", () => {
  it("returns no segments for an empty day", () => {
    expect(buildDayRibbon([])).toEqual([]);
  });

  it("renders a single entry as one full-width segment", () => {
    expect(buildDayRibbon([e("#3F8F6B")])).toEqual([
      { color: "#3F8F6B", count: 1, ratio: 1 },
    ]);
  });

  it("collapses same-color entries into one weighted segment", () => {
    expect(buildDayRibbon([e("#3F8F6B"), e("#3F8F6B"), e("#3F8F6B")])).toEqual([
      { color: "#3F8F6B", count: 3, ratio: 1 },
    ]);
  });

  it("splits mixed sentiments proportionally in first-seen order", () => {
    const segs = buildDayRibbon([e("#3F8F6B"), e("#C45B4C"), e("#3F8F6B"), e("#3F8F6B")]);
    expect(segs).toEqual([
      { color: "#3F8F6B", count: 3, ratio: 0.75 },
      { color: "#C45B4C", count: 1, ratio: 0.25 },
    ]);
    expect(segs.reduce((s, x) => s + x.ratio, 0)).toBeCloseTo(1);
  });

  it("folds entries with no sentiment into a neutral segment", () => {
    const segs = buildDayRibbon([e(null), e("#3F8F6B"), e(null)]);
    expect(segs).toEqual([
      { color: NEUTRAL_COLOR, count: 2, ratio: 2 / 3 },
      { color: "#3F8F6B", count: 1, ratio: 1 / 3 },
    ]);
  });
});
