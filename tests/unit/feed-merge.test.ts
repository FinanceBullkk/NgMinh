import { describe, expect, it } from "vitest";
import { mergeFeedPages, insertByFeedOrder } from "@/lib/utils/feed-merge";
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

// Entry with explicit (entry_date, created_at) for ordering tests.
const at = (id: string, entry_date: string, created_at: string): FeedEntry => ({
  ...entry(id),
  entry_date,
  created_at,
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

describe("insertByFeedOrder", () => {
  // A descending feed: 06-22 (newest) → 06-20 (oldest).
  const base = [
    at("d22", "2026-06-22", "2026-06-22T10:00:00Z"),
    at("d21", "2026-06-21", "2026-06-21T10:00:00Z"),
    at("d20", "2026-06-20", "2026-06-20T10:00:00Z"),
  ];
  const ord = (xs: FeedEntry[]) => xs.map((e) => e.id);

  it("puts a today (newest-date) entry at the front", () => {
    expect(ord(insertByFeedOrder(base, at("new", "2026-06-23", "2026-06-23T09:00:00Z")))).toEqual([
      "new",
      "d22",
      "d21",
      "d20",
    ]);
  });

  it("slots a back-dated entry into its correct day position, not the top", () => {
    expect(ord(insertByFeedOrder(base, at("back", "2026-06-21", "2026-06-21T23:00:00Z")))).toEqual([
      "d22",
      "back", // same date as d21 but later created_at → sorts above d21
      "d21",
      "d20",
    ]);
  });

  it("places an entry older than everything at the end", () => {
    expect(ord(insertByFeedOrder(base, at("oldest", "2026-06-01", "2026-06-01T10:00:00Z")))).toEqual(
      ["d22", "d21", "d20", "oldest"],
    );
  });

  it("tie-breaks same entry_date by created_at DESC", () => {
    const sameDay = [
      at("a", "2026-06-22", "2026-06-22T12:00:00Z"),
      at("c", "2026-06-22", "2026-06-22T08:00:00Z"),
    ];
    expect(ord(insertByFeedOrder(sameDay, at("b", "2026-06-22", "2026-06-22T10:00:00Z")))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("inserts into an empty feed", () => {
    expect(ord(insertByFeedOrder([], at("only", "2026-06-22", "2026-06-22T10:00:00Z")))).toEqual([
      "only",
    ]);
  });
});
