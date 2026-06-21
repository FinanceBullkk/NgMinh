import type { EntryType } from "@/lib/types/models";

// The 5 fixed entry types (spec §5). Labels are Vietnamese; values match the DB enum.
export const ENTRY_TYPES: { value: EntryType; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "feedback", label: "Feedback" },
  { value: "win", label: "Win" },
  { value: "concern", label: "Lo ngại" },
  { value: "note", label: "Ghi chú" },
];

export const ENTRY_TYPE_LABEL = Object.fromEntries(
  ENTRY_TYPES.map((t) => [t.value, t.label]),
) as Record<EntryType, string>;
