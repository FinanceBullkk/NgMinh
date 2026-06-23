import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gatherUserData } from "@/lib/data/export";
import { logEvent } from "@/lib/security/audit";

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

  // Audit the full-data dump (the most sensitive read). Non-sensitive counter only — never HR
  // content. Fire-and-forget: a logging failure (incl. a transport-level reject) must not block
  // the export the user asked for.
  try {
    await logEvent(supabase, "export", { bytes: body.length });
  } catch {
    // swallow — auditing is best-effort, the export must still succeed
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="team-tracker-export-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
