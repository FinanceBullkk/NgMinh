import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/types/database";

type Db = SupabaseClient<Database>;

// Security audit trail (audit M3). NEVER pass tokens, passwords, or HR content (employee names,
// note bodies) as metadata — only the event type plus small non-sensitive counters/flags.

// DB-backed events (survive while the account exists, user can review their own log):
// export, delete_all, reauth_failure. Writes go through the SECURITY DEFINER RPC so the row
// is unforgeable (user_id is stamped server-side) and append-only.
export async function logEvent(
  supabase: Db,
  eventType: string,
  metadata: Record<string, Json> = {},
): Promise<void> {
  await supabase.rpc("log_security_event", {
    p_event_type: eventType,
    p_metadata: metadata as Json,
  });
}

// Server-log events that must survive account deletion or have no session yet:
// delete_account (its DB row would cascade away with the account) and login_failure (pre-auth).
// Structured single-line JSON to stderr for log aggregation. No tokens/PII content.
export function logServerEvent(
  eventType: string,
  metadata: Record<string, unknown> = {},
): void {
  console.warn(
    JSON.stringify({ securityEvent: eventType, ...metadata, at: new Date().toISOString() }),
  );
}
