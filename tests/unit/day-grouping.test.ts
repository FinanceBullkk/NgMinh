import { afterEach, describe, expect, it, vi } from "vitest";
import { groupByDay } from "@/lib/utils/day-grouping";

describe("groupByDay", () => {
  afterEach(() => vi.useRealTimers());

  it("uses the Asia/Saigon calendar day at the UTC boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T17:30:00Z")); // 2026-06-22 in Saigon

    const groups = groupByDay([
      { id: "today", entry_date: "2026-06-22" },
      { id: "yesterday", entry_date: "2026-06-21" },
      { id: "week", entry_date: "2026-06-18" },
      { id: "older", entry_date: "2026-06-14" },
    ]);

    expect(groups.map(({ key, label }) => ({ key, label }))).toEqual([
      { key: "today", label: "Today" },
      { key: "yesterday", label: "Yesterday" },
      { key: "this-week", label: "This week" },
      { key: "2026-06-14", label: "2026-06-14" },
    ]);
  });

  it("keeps input order inside each day bucket", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T08:00:00Z"));

    const [today] = groupByDay([
      { id: "newer", entry_date: "2026-06-21" },
      { id: "older", entry_date: "2026-06-21" },
    ]);

    expect(today.items.map((item) => item.id)).toEqual(["newer", "older"]);
  });
});
