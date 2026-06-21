import { listEmployeesWithMeta } from "@/lib/data/employees";
import { listTags } from "@/lib/data/tags";
import { listSentimentOptions } from "@/lib/data/sentiment";
import { hasEntryOn } from "@/lib/data/entries";
import { RosterGrid } from "@/components/roster/roster-grid";

// Roster home (Server Component): fetch RLS-scoped data, hand to the client grid.
export default async function RosterPage() {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Saigon" });
  const [employees, tags, sentiments, hasEntryToday] = await Promise.all([
    listEmployeesWithMeta(),
    listTags(),
    listSentimentOptions(),
    hasEntryOn(today),
  ]);
  return (
    <RosterGrid
      employees={employees}
      tags={tags}
      sentiments={sentiments}
      hasEntryToday={hasEntryToday}
    />
  );
}
