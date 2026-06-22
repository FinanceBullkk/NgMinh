import { describe, expect, it } from "vitest";
import { mergeFeedPages } from "@/lib/utils/feed-merge";
import type { FeedEntry } from "@/lib/types/models";

const entry = (id: string): FeedEntry => ({
  id,
  user_id: "u",
  employee_id: "e",
  entry_date: "2026-06-22",
  type: "note",
  content: id,
  sentiment_id: null,
  created_at: "",
  employeeName: "X",
  sentiment: null,
});
const ids = (xs: FeedEntry[]) => xs.map((e) => e.id);

describe("mergeFeedPages", () => {
  it("keeps first page on top, then older pages", () => {
    expect(ids(mergeFeedPages([entry("a"), entry("b")], [entry("c")]))).toEqual(["a", "b", "c"]);
  });

  it("dedupes by id when an older page overlaps the first (offset shift after a write)", () => {
    expect(ids(mergeFeedPages([entry("a"), entry("b")], [entry("b"), entry("c")]))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("reflects a fresh first page (frozen-list regression)", () => {
    expect(ids(mergeFeedPages([entry("new"), entry("a")], []))).toEqual(["new", "a"]);
  });

  it("handles empty input", () => {
    expect(mergeFeedPages([], [])).toEqual([]);
  });
});
