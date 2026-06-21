import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

// Browser client for Client Components. Publishable key is safe to embed.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
