import { describe, expect, it } from "vitest";
import { computeSentimentTrend } from "@/lib/utils/sentiment-trend";

const e = (entry_date: string, weight: number | null) => ({ entry_date, weight });

describe("computeSentimentTrend", () => {
  it("returns 'insufficient' with fewer than 2 weighted entries", () => {
    expect(computeSentimentTrend([])).toBe("insufficient");
    expect(computeSentimentTrend([e("2026-06-01", 1)])).toBe("insufficient");
    // entries without a sentiment weight don't count toward the minimum
    expect(computeSentimentTrend([e("2026-06-01", 1), e("2026-06-02", null)])).toBe(
      "insufficient",
    );
  });

  it("'warm' when recent average polarity is positive", () => {
    expect(computeSentimentTrend([e("2026-06-01", 1), e("2026-06-02", 1)])).toBe("warm");
    expect(computeSentimentTrend([e("2026-06-01", 1), e("2026-06-02", 0)])).toBe("warm");
  });

  it("'cool' when recent average polarity is negative (matches cooling)", () => {
    expect(computeSentimentTrend([e("2026-06-01", -1), e("2026-06-02", -1)])).toBe("cool");
    expect(computeSentimentTrend([e("2026-06-01", 0), e("2026-06-02", -1)])).toBe("cool");
  });

  it("'stable' when recent average is exactly neutral", () => {
    expect(computeSentimentTrend([e("2026-06-01", -1), e("2026-06-02", 1)])).toBe("stable");
    expect(computeSentimentTrend([e("2026-06-01", 0), e("2026-06-02", 0)])).toBe("stable");
  });

  it("only weighs the most recent `window` entries (default 5)", () => {
    // 5 recent negatives dominate; an older positive is outside the window.
    const entries = [
      e("2026-01-01", 1), // oldest, outside window
      e("2026-06-01", -1),
      e("2026-06-02", -1),
      e("2026-06-03", -1),
      e("2026-06-04", -1),
      e("2026-06-05", -1),
    ];
    expect(computeSentimentTrend(entries)).toBe("cool");
  });

  it("respects a custom window/min", () => {
    expect(computeSentimentTrend([e("2026-06-01", 1)], { min: 1 })).toBe("warm");
    // window=2 keeps only the 2 newest (both positive) → warm, ignoring older negatives
    const entries = [e("2026-06-01", -1), e("2026-06-02", 1), e("2026-06-03", 1)];
    expect(computeSentimentTrend(entries, { window: 2 })).toBe("warm");
  });
});
