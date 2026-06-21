import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gatherUserData } from "@/lib/data/export";

// GET /settings/export → downloads the user's full data as JSON (RLS-scoped).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await gatherUserData();
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Saigon" });
  const body = JSON.stringify({ exported_at: new Date().toISOString(), ...data }, null, 2);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="team-tracker-export-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
