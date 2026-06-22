import { RosterView } from "@/components/roster/roster-view";

// Roster home: data fetched client-side via SWR (browser→Supabase), no server fetch.
export default function RosterPage() {
  return <RosterView />;
}
