import { createClient } from "@/lib/supabase/server";
import { gatherUserDataForClient } from "@/lib/data/user-data";

// Gather ALL of the current user's data (RLS-scoped) for a portable JSON export.
// Enumerate every table — keep in sync with the schema.
export async function gatherUserData() {
  const supabase = await createClient();
  return gatherUserDataForClient(supabase);
}
