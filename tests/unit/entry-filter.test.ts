import { describe, expect, it } from "vitest";
import { matchesEntryFilter, type EntryFilter } from "@/lib/utils/entry-filter";
import type { EntryType } from "@/lib/types/models";

const row = (employee_id: string, type: EntryType) => ({ employee_id, type });
const base: EntryFilter = { person: "", selectedTypes: new Set(), tagEmployeeIds: null };

describe("matchesEntryFilter", () => {
  it("matches everything when no dimension is active", () => {
    expect(matchesEntryFilter(row("a", "note"), base)).toBe(true);
  });

  it("filters by person", () => {
    const f = { ...base, person: "a" };
    expect(matchesEntryFilter(row("a", "note"), f)).toBe(true);
    expect(matchesEntryFilter(row("b", "note"), f)).toBe(false);
  });

  it("filters by type (OR within the set)", () => {
    const f = { ...base, selectedTypes: new Set<EntryType>(["win", "concern"]) };
    expect(matchesEntryFilter(row("a", "win"), f)).toBe(true);
    expect(matchesEntryFilter(row("a", "concern"), f)).toBe(true);
    expect(matchesEntryFilter(row("a", "note"), f)).toBe(false);
  });

  it("filters by tag-resolved employee ids", () => {
    const f = { ...base, tagEmployeeIds: ["a", "c"] };
    expect(matchesEntryFilter(row("a", "note"), f)).toBe(true);
    expect(matchesEntryFilter(row("b", "note"), f)).toBe(false);
  });

  it("an empty tag-id list matches nobody", () => {
    expect(matchesEntryFilter(row("a", "note"), { ...base, tagEmployeeIds: [] })).toBe(false);
  });

  it("ANDs across dimensions", () => {
    const f: EntryFilter = {
      person: "a",
      selectedTypes: new Set<EntryType>(["win"]),
      tagEmployeeIds: ["a", "b"],
    };
    expect(matchesEntryFilter(row("a", "win"), f)).toBe(true);
    expect(matchesEntryFilter(row("a", "note"), f)).toBe(false); // wrong type
    expect(matchesEntryFilter(row("b", "win"), f)).toBe(false); // wrong person
  });
});
