import type { Database } from "./database";

// Convenience aliases over the generated Database type. Import these, not the raw paths.
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// App-facing row types.
export type Employee = Tables<"employees">;
export type Entry = Tables<"entries">;
export type Goal = Tables<"goals">;
export type SentimentOption = Tables<"sentiment_options">;
export type Tag = Tables<"tags">;

export type EntryType = Enums<"entry_type">;
export type GoalStatus = Enums<"goal_status">;

// Roster card shape: an employee plus its tags, recent sentiment colors (sparkline)
// and action nudges (Phase 2). Nudge shape kept inline to avoid a circular import.
export type EmployeeCard = Employee & {
  tags: Tag[];
  sentimentColors: string[];
  nudges: { stale1on1: boolean; cooling: boolean };
};

// A timeline entry with its sentiment label+color resolved (incl. archived options).
export type TimelineEntry = Entry & {
  sentiment: { label: string; color: string } | null;
};

// Feed (cross-person) entry: timeline entry + the employee it belongs to.
export type FeedEntry = TimelineEntry & {
  employeeName: string;
};
