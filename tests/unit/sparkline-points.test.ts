import { describe, expect, it } from "vitest";
import { buildSentimentColorSeries } from "@/lib/utils/sparkline-points";

describe("buildSentimentColorSeries", () => {
  it("orders observations chronologically, caps recent points, and keeps archived colors", () => {
    const sentiments = [
      { id: "positive", color: "#3f8f6b", is_archived: true },
      { id: "negative", color: "#c45b4c", is_archived: false },
    ];
    const entries = [
      { sentiment_id: "negative", entry_date: "2026-06-21", created_at: "2026-06-21T09:00:00Z" },
      { sentiment_id: "positive", entry_date: "2026-06-20", created_at: "2026-06-20T09:00:00Z" },
      { sentiment_id: null, entry_date: "2026-06-22", created_at: "2026-06-22T09:00:00Z" },
    ];

    expect(buildSentimentColorSeries(entries, sentiments, 1)).toEqual(["#c45b4c"]);
    expect(buildSentimentColorSeries(entries, sentiments)).toEqual([
      "#3f8f6b",
      "#c45b4c",
    ]);
  });

  it("returns no points for empty, unresolved, or zero-limit input", () => {
    const entry = {
      sentiment_id: "missing",
      entry_date: "2026-06-21",
      created_at: "2026-06-21T09:00:00Z",
    };

    expect(buildSentimentColorSeries([], [])).toEqual([]);
    expect(buildSentimentColorSeries([entry], [])).toEqual([]);
    expect(buildSentimentColorSeries([entry], [], 0)).toEqual([]);
  });
});
