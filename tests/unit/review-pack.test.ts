import { describe, expect, it } from "vitest";
import { buildReviewMarkdown, inRange } from "@/lib/utils/review-pack";
import type { Goal, TimelineEntry } from "@/lib/types/models";

const entry = (over: Partial<TimelineEntry>): TimelineEntry =>
  ({
    id: "x",
    user_id: "u",
    employee_id: "emp",
    entry_date: "2026-06-10",
    type: "note",
    content: "c",
    sentiment_id: null,
    created_at: "2026-06-10T00:00:00Z",
    sentiment: null,
    ...over,
  }) as TimelineEntry;

const goal = (over: Partial<Goal>): Goal =>
  ({
    id: "g",
    user_id: "u",
    employee_id: "emp",
    content: "Ship",
    status: "open",
    target_date: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...over,
  }) as Goal;

describe("inRange", () => {
  it("inclusive bounds", () => {
    expect(inRange("2026-06-10", "2026-06-01", "2026-06-30")).toBe(true);
    expect(inRange("2026-07-01", "2026-06-01", "2026-06-30")).toBe(false);
  });
});

describe("buildReviewMarkdown", () => {
  const entries = [
    entry({ type: "win", entry_date: "2026-06-10", content: "Shipped X" }),
    entry({ type: "concern", entry_date: "2026-06-12", content: "Missed standup" }),
    entry({ type: "note", entry_date: "2026-06-13", content: "ignored note" }),
    entry({ type: "win", entry_date: "2026-05-01", content: "out of range win" }),
  ];
  const goals = [goal({ content: "Lead a project", status: "open" })];
  const md = buildReviewMarkdown("An", entries, goals, "2026-06-01", "2026-06-30");

  it("includes in-range wins and concerns", () => {
    expect(md).toContain("Shipped X");
    expect(md).toContain("Missed standup");
  });
  it("excludes other types and out-of-range entries", () => {
    expect(md).not.toContain("ignored note");
    expect(md).not.toContain("out of range win");
  });
  it("lists goals with status", () => {
    expect(md).toContain("- [open] Lead a project");
  });
  it("renders empty sections gracefully", () => {
    const empty = buildReviewMarkdown("An", [], [], "2026-06-01", "2026-06-30");
    expect(empty).toContain("- (none)");
  });
});
