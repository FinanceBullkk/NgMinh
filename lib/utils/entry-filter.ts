// The roster/feed filter, shared by the Feed list and the Calendar so both views filter
// identically. Pure predicate → unit-testable; the tag dimension is pre-resolved to employee
// ids by the caller (which already holds the tag→employee map).
import type { EntryType } from "@/lib/types/models";

export type EntryFilter = {
  person: string; // "" = all people
  selectedTypes: Set<EntryType>; // empty = all types
  tagEmployeeIds: string[] | null; // null = no tag constraint
};

// The shell's full filter state: the predicate inputs plus the bits the Feed list needs to
// drive its global (all-time) refetch. Lives here (a leaf util) to avoid a component cycle.
export type FeedFilterState = EntryFilter & {
  filtering: boolean; // any dimension active
  filterKey: string; // identity of the active filter (drives/validates cached fetches)
};

export function matchesEntryFilter(
  e: { employee_id: string; type: EntryType },
  f: EntryFilter,
): boolean {
  if (f.person && e.employee_id !== f.person) return false;
  if (f.selectedTypes.size && !f.selectedTypes.has(e.type)) return false;
  if (f.tagEmployeeIds && !f.tagEmployeeIds.includes(e.employee_id)) return false;
  return true;
}
