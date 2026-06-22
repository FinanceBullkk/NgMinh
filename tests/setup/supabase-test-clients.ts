import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type TestClient = SupabaseClient<Database>;

type LocalConfig = {
  apiUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
};

// Local stack config (api url + keys + jwt secret) for tests that forge/expire tokens.
export function localTestConfig(): { apiUrl: string; anonKey: string; jwtSecret: string } {
  const c = localConfig();
  return { apiUrl: c.apiUrl, anonKey: c.anonKey, jwtSecret: c.jwtSecret };
}

export type TestUser = {
  id: string;
  email: string;
  password: string;
  client: TestClient;
};

export type SupabaseTestContext = {
  admin: TestClient;
  userA: TestUser;
  userB: TestUser;
  cleanup: () => Promise<void>;
};

let cachedConfig: LocalConfig | undefined;

function localConfig(): LocalConfig {
  if (cachedConfig) return cachedConfig;
  const output = execFileSync("supabase", ["status", "-o", "env"], {
    encoding: "utf8",
  });
  const values = new Map<string, string>();
  for (const line of output.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    values.set(match[1], match[2].replace(/^"|"$/g, ""));
  }

  const apiUrl = values.get("API_URL");
  const anonKey = values.get("PUBLISHABLE_KEY") ?? values.get("ANON_KEY");
  const serviceRoleKey = values.get("SERVICE_ROLE_KEY");
  const jwtSecret = values.get("JWT_SECRET");
  if (!apiUrl || !anonKey || !serviceRoleKey || !jwtSecret) {
    throw new Error("Local Supabase is unavailable or returned incomplete credentials");
  }
  cachedConfig = { apiUrl, anonKey, serviceRoleKey, jwtSecret };
  return cachedConfig;
}

function client(key: string): TestClient {
  return createClient<Database>(localConfig().apiUrl, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createAdminTestClient(): TestClient {
  return client(localConfig().serviceRoleKey);
}

export async function createTestUser(
  admin = createAdminTestClient(),
  prefix = "phase9",
): Promise<TestUser> {
  const token = randomUUID();
  const email = `${prefix}-${token}@example.test`;
  const password = `Phase9-${token}!Aa1`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error("Supabase did not return the created user");
  }

  const userClient = client(localConfig().anonKey);
  const signedIn = await userClient.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  return { id: created.data.user.id, email, password, client: userClient };
}

export async function createSupabaseTestContext(): Promise<SupabaseTestContext> {
  const admin = createAdminTestClient();
  const userA = await createTestUser(admin, "phase9-a");
  const userB = await createTestUser(admin, "phase9-b");

  return {
    admin,
    userA,
    userB,
    cleanup: async () => {
      await Promise.all([
        admin.auth.admin.deleteUser(userA.id),
        admin.auth.admin.deleteUser(userB.id),
      ]);
    },
  };
}
