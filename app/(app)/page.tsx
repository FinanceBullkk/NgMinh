import { listEmployeesWithMeta } from "@/lib/data/employees";
import { listTags } from "@/lib/data/tags";
import { RosterGrid } from "@/components/roster/roster-grid";

// Roster home (Server Component): fetch RLS-scoped data, hand to the client grid.
export default async function RosterPage() {
  const [employees, tags] = await Promise.all([
    listEmployeesWithMeta(),
    listTags(),
  ]);
  return <RosterGrid employees={employees} tags={tags} />;
}
