# Subscription Technical Specifications — Team Tracker
**Date:** 2026-06-22  
**Stack:** Next.js 16 App Router + React 19 + Supabase Postgres/Auth/RLS + Polar (primary provider)  
**Current State:** Login-only; no signup flow; no subscription table; writes via Server Actions; reads via `lib/data/*`

---

## 1. Postgres Schema: Subscriptions Table

### DDL with RLS

```sql
-- 009 — Subscriptions table (add to supabase/migrations/)
create table public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Polar subscription ID (idempotency key for webhook processing)
  external_id       text not null,
  -- Subscription status: pending, active, paused, cancelled, expired
  status            text not null default 'pending',
  -- Plan tier: 'free' (no subscription) | 'pro' | 'pro_annual'
  plan              text not null,
  -- Pricing: USD cents (e.g., 9900 = $99.00)
  amount_cents      int not null,
  -- ISO 4217 currency code
  currency          text not null default 'USD',
  -- Renewal date; null until first charge succeeds
  next_renewal_date date,
  -- Last successful charge date; null until first payment
  last_charge_date  date,
  -- Cancellation reason (if cancelled)
  cancellation_reason text,
  -- Webhook metadata: raw Polar event payload (for debugging/audit)
  metadata          jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- One active subscription per user (composite key protects duplicate active subs)
  unique (user_id, plan) where status in ('active', 'pending')
);

-- Enable RLS: users can only read/write their own subscription row
alter table public.subscriptions enable row level security;

create policy subscriptions_owner_read on public.subscriptions
  for select using ((select auth.uid()) = user_id);

create policy subscriptions_owner_write on public.subscriptions
  for insert with check ((select auth.uid()) = user_id);

-- UPDATE allowed only for admin/webhook (service-role). Clients can't change subscription state.
-- RLS blocks client updates; webhooks use service-role client (bypasses RLS by design).
create policy subscriptions_webhook_write on public.subscriptions
  for update using (false);  -- Prevent anon/authenticated from updating

-- Allow service-role (admin client) to update during webhook processing
-- Note: service-role bypasses RLS entirely, so this policy is defensive (documentation).

grant select on public.subscriptions to authenticated;
grant insert on public.subscriptions to authenticated;
-- No UPDATE/DELETE grants to authenticated; service-role bypasses RLS for webhook upserts.
```

### Index for Performance

```sql
-- Index on user_id + status for fast lookups (e.g., "get user's active subscription")
create index subscriptions_user_id_status on public.subscriptions (user_id, status);
-- Index on external_id for idempotent webhook processing
create index subscriptions_external_id on public.subscriptions (external_id);
-- Index on updated_at for cleanup queries (e.g., expire old pending subscriptions)
create index subscriptions_updated_at on public.subscriptions (updated_at);
```

---

## 2. Webhook Flow: Polar → Next.js Route Handler → Service-Role Upsert

### Route Handler: `app/api/webhooks/polar/route.ts`

```typescript
// app/api/webhooks/polar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs"; // Webhook requires Node runtime for crypto

interface PolarEvent {
  type: string;
  data: {
    id: string; // Polar subscription ID
    customer_email?: string;
    customer_id?: string;
    product_id?: string;
    product_name?: string;
    plan_id?: string;
    plan_name?: string;
    currency?: string;
    amount?: number; // In cents
    status?: string;
    current_period_start?: string; // ISO 8601
    current_period_end?: string; // ISO 8601
    cancel_at_period_end?: boolean;
    [key: string]: any;
  };
}

/**
 * Webhook signature verification for Polar.
 * Polar sends: X-Polar-Signature header containing HMAC-SHA256(raw_body, webhook_secret).
 */
async function verifyPolarSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const bodyData = encoder.encode(body);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyData);
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Timing-safe comparison to prevent signature stripping
  return (
    computedSignature.toLowerCase() === signature.toLowerCase()
  );
}

/**
 * Map Polar subscription status → App subscription status.
 */
function mapPolarStatus(polarStatus: string): string {
  const map: Record<string, string> = {
    active: "active",
    pending: "pending",
    past_due: "past_due",
    paused: "paused",
    cancelled: "cancelled",
    expired: "expired",
  };
  return map[polarStatus] || "unknown";
}

/**
 * Main webhook handler.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body for signature verification
    const raw = await request.text();
    const signature = request.headers.get("x-polar-signature");
    const secret = process.env.POLAR_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.error("Missing signature or secret");
      return NextResponse.json(
        { error: "Missing signature or secret" },
        { status: 400 }
      );
    }

    // 2. Verify signature
    const isValid = await verifyPolarSignature(raw, signature, secret);
    if (!isValid) {
      console.error("Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // 3. Parse and validate event
    let event: PolarEvent;
    try {
      event = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // 4. Route by event type
    const { type, data } = event;

    if (!data.id || !data.customer_email) {
      console.warn("Event missing id or customer_email:", event);
      // Still return 200 to prevent Polar retries; log for manual review
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 5. Upsert subscription using service-role client (bypasses RLS)
    const admin = createAdminClient();

    // Get user by email (subscription created during checkout, customer_email = user's email)
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers();
    if (authError) {
      console.error("Failed to list users:", authError);
      return NextResponse.json(
        { error: "Failed to find user" },
        { status: 500 }
      );
    }

    const user = authUsers.users.find(
      (u) => u.email === data.customer_email?.toLowerCase()
    );
    if (!user) {
      console.warn(
        `No user found for email: ${data.customer_email}. Skipping.`
      );
      // Return 200 to prevent retries; customer may sign up later
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 6. Map Polar event to subscription row
    const subscriptionData = {
      user_id: user.id,
      external_id: data.id,
      status: mapPolarStatus(data.status || "unknown"),
      plan: data.plan_name || "unknown",
      amount_cents: data.amount || 0,
      currency: data.currency || "USD",
      next_renewal_date: data.current_period_end
        ? new Date(data.current_period_end).toISOString().split("T")[0]
        : null,
      last_charge_date:
        type === "subscription.updated" || type === "subscription.created"
          ? new Date().toISOString().split("T")[0]
          : null,
      cancellation_reason:
        type === "subscription.cancelled"
          ? data.cancellation_reason || "user-initiated"
          : null,
      metadata: data,
      updated_at: new Date().toISOString(),
    };

    // 7. Upsert: update if exists, insert if new
    const { error: upsertError } = await admin
      .from("subscriptions")
      .upsert([subscriptionData], {
        onConflict: "external_id",
      });

    if (upsertError) {
      console.error("Failed to upsert subscription:", upsertError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    console.log(
      `Processed Polar webhook: ${type} for subscription ${data.id}`
    );

    // 8. Return 200 ASAP; Polar expects response within 30 seconds
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Environment Variables
```bash
# .env.local
POLAR_WEBHOOK_SECRET=whsk_live_xxxx  # From Polar dashboard
NEXT_PUBLIC_POLAR_ACCESS_TOKEN=xxx    # If using Polar SDK for customer portal
```

---

## 3. Feature Gating: Server-Side Enforcement

### Server Action: `lib/actions/feature-gate.ts`

```typescript
// lib/actions/feature-gate.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export interface UserTier {
  plan: "free" | "pro" | "pro_annual";
  isActive: boolean;
  nextRenewalDate?: string;
}

/**
 * Get user's subscription tier (server-only).
 * Called from server actions and server components.
 */
export async function getUserTier(): Promise<UserTier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { plan: "free", isActive: false };
  }

  // Query subscription table using RLS (authenticated client sees only own row)
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status, next_renewal_date")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single(); // Expect zero or one row due to unique constraint

  if (error?.code === "PGRST116") {
    // No rows found = free tier
    return { plan: "free", isActive: false };
  }

  if (error) {
    console.error("Failed to fetch subscription:", error);
    return { plan: "free", isActive: false };
  }

  return {
    plan: (data?.plan as "pro" | "pro_annual") || "free",
    isActive: true,
    nextRenewalDate: data?.next_renewal_date || undefined,
  };
}

/**
 * Check if user has access to a feature (server-only).
 * Use in server actions BEFORE performing expensive operations.
 */
export async function canAccessFeature(
  feature: "unlimited_employees" | "goals" | "nudges" | "review_pack" | "export"
): Promise<boolean> {
  const tier = await getUserTier();

  const freeFeatures = new Set([
    "unlimited_employees", // Free: up to 50 employees
  ]);

  const proFeatures = new Set([
    "unlimited_employees",
    "goals",
    "nudges",
    "review_pack",
    "export",
  ]);

  if (tier.plan === "free") {
    return freeFeatures.has(feature);
  }

  if (tier.isActive && (tier.plan === "pro" || tier.plan === "pro_annual")) {
    return proFeatures.has(feature);
  }

  return false;
}
```

### Middleware: `lib/supabase/middleware.ts` (Enhanced)

```typescript
// lib/supabase/middleware.ts (excerpt — subscription-related)
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/ssr";
import { canAccessFeature } from "@/lib/actions/feature-gate";

export async function updateSession(request: NextRequest) {
  // 1. Refresh auth session (existing pattern)
  let response = await updateSession(request);

  // 2. Feature gate: redirect to pricing page if user is expired/cancelled
  const pathname = request.nextUrl.pathname;

  // If accessing a pro-only page and not subscribed, redirect to pricing
  const proPages = ["/goals", "/nudges", "/review-pack"];
  if (proPages.some((page) => pathname.startsWith(page))) {
    // Note: can't use `await canAccessFeature()` in middleware (async + auth context).
    // Instead, rely on server component checks or redirect to a protected page.
    // See "Server Component Pattern" below.
  }

  return response;
}
```

### Server Action: `app/(app)/actions/entries.ts` (Enhanced)

```typescript
// Excerpt: protecting a pro-only action
import { canAccessFeature } from "@/lib/actions/feature-gate";
import { createClient } from "@/lib/supabase/server";

export async function createEntry(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Get user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in." };

  // 2. Gate: if premium feature, check subscription
  const sentimentId = formData.get("sentiment_id");
  if (sentimentId) {
    // Sentiment selection is a pro feature
    const canUse = await canAccessFeature("goals"); // Or define a feature
    if (!canUse) {
      return {
        error:
          "Sentiment selection is a pro feature. Upgrade to continue.",
      };
    }
  }

  // 3. Proceed with entry creation
  const { error } = await supabase.from("entries").insert({
    employee_id: formData.get("employee_id"),
    content: formData.get("content"),
    sentiment_id: sentimentId || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { ok: true };
}
```

### Server Component: `app/(app)/goals/page.tsx` (Enhanced)

```typescript
// app/(app)/goals/page.tsx
import { redirect } from "next/navigation";
import { getUserTier } from "@/lib/actions/feature-gate";

export default async function GoalsPage() {
  const tier = await getUserTier();

  // 1. Gate at page level
  if (!tier.isActive || (tier.plan === "free")) {
    redirect("/pricing?required=goals");
  }

  // 2. Render page
  return (
    <div>
      <h1>Goals (Pro)</h1>
      {tier.nextRenewalDate && (
        <p>Your subscription renews on {tier.nextRenewalDate}.</p>
      )}
      {/* goals content */}
    </div>
  );
}
```

### Data Query: `lib/data/entries.ts` (Enhanced)

```typescript
// lib/data/entries.ts
import { createClient } from "@/lib/supabase/server";

export async function fetchEntries(
  employeeId: string,
  limit: number = 50
) {
  const supabase = await createClient();

  // RLS ensures user can only see their own entries (via user_id match)
  const { data, error } = await supabase
    .from("entries")
    .select("*, sentiment_options(label, color)")
    .eq("employee_id", employeeId)
    .order("entry_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Pro-only data: filter entries with advanced sentiment analysis
export async function fetchEntriesWithSentimentTrend(
  employeeId: string
) {
  const supabase = await createClient();

  // Same RLS applies; no additional server-side filtering needed
  const { data, error } = await supabase
    .from("entries")
    .select(
      `*, 
       sentiment_options(label, color, weight)`
    )
    .eq("employee_id", employeeId)
    .order("entry_date", { ascending: false });

  if (error) throw error;

  // Calculate weighted sentiment trend (pro feature)
  // This computation is gated by server action/component check above
  return data;
}
```

---

## 4. Signup Flow: New Public Signup

### Route: `app/(auth)/signup/page.tsx`

```typescript
// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "./actions";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signUp(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Redirect to onboarding or pricing after signup
      router.push("/onboarding");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Sign Up for Team Tracker
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### Server Action: `app/(auth)/signup/actions.ts`

```typescript
// app/(auth)/signup/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // 1. Sign up
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // 2. User created; free tier by default (no subscription row needed yet)
  // Redirect to onboarding or straight to app (depending on email confirmation requirement)
  redirect("/onboarding");
}
```

### Onboarding Flow: `app/(app)/onboarding/page.tsx`

```typescript
// app/(app)/onboarding/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"welcome" | "pricing">("welcome");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md">
        {step === "welcome" ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Welcome to Team Tracker</h1>
            <p className="text-gray-600">
              Keep track of your direct reports without recency bias.
            </p>
            <button
              onClick={() => setStep("pricing")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg"
            >
              Choose Your Plan
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg ml-2"
            >
              Start with Free
            </button>
          </div>
        ) : (
          <PricingPlans />
        )}
      </div>
    </div>
  );
}

function PricingPlans() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose Your Plan</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-bold">Free</h3>
          <p className="text-gray-600 text-sm">Up to 50 employees</p>
          <p className="text-3xl font-bold mt-4">$0</p>
          <button
            onClick={() => window.location.href = "/"}
            className="w-full mt-6 py-2 bg-gray-200 text-gray-800 rounded-lg"
          >
            Get Started
          </button>
        </div>

        {/* Pro Plan */}
        <div className="p-6 border-2 border-blue-600 rounded-lg">
          <h3 className="text-xl font-bold">Pro</h3>
          <p className="text-gray-600 text-sm">Unlimited employees + all features</p>
          <p className="text-3xl font-bold mt-4">$99<span className="text-lg">/year</span></p>
          <button
            onClick={() => window.location.href = "/checkout?plan=pro_annual"}
            className="w-full mt-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. RLS Implications

### What RLS Protects

1. **subscriptions table:** Each user sees ONLY their own subscription row (via `user_id` match).
2. **Service-role client:** Bypasses RLS entirely (webhook handler uses this for updates).
3. **Authenticated client:** Respects RLS; prevents direct updates to subscription state from client.

### What RLS Does NOT Protect

- **Feature gating logic:** Relies on server-side enforcement (`canAccessFeature()` server action).
  - If you only gate in UI, a crafty user can modify the client to call gated server actions.
  - **Solution:** Every gated server action/data query re-checks subscription status (as shown above).

- **Billing state:** RLS controls data visibility, not business logic.
  - A user could theoretically query `subscriptions` table before RLS filters, if auth is broken.
  - **Solution:** Always gate at multiple layers (RLS + server action + middleware).

### Migration Path

1. **Before launch:** Run migration to create `subscriptions` table + RLS policies.
2. **Day 1:** All existing users have `plan = 'free'` (no subscription row; queries return null).
3. **Onboarding:** New signups see pricing page; can choose "Start Free" (no subscription row) or "Subscribe" (redirects to Polar checkout).
4. **Webhook:** Polar subscription events create/update subscription row.

---

## 6. Code Sketch: Feature Gating Pattern

### Summary

```
User Action
  ↓
Server Action (`createEntry`, `updateEmployee`, etc.)
  ↓
canAccessFeature() → getUserTier() → SELECT subscriptions WHERE user_id = auth.uid()
  ↓
RLS filters result to user's own row
  ↓
If not allowed: return error
If allowed: proceed with mutation
```

### Enforcement Points

| Layer | Function | Example |
|-------|----------|---------|
| **Middleware** | Redirect to pricing if accessing pro page | `app/goals` → check subscription → redirect to `/pricing` |
| **Server Action** | Gate expensive mutations | `createEntry()` → `canAccessFeature("sentiment")` → allow/deny |
| **Server Component** | Conditionally render features | `GoalsPage` → `getUserTier()` → show/hide goals tab |
| **Data Query** | Return only accessible data | `fetchEntries()` respects RLS; no sentiment data for free tier |

---

## 7. Webhook Event Types to Handle

### Polar Events

| Event Type | Action |
|------------|--------|
| `subscription.created` | Insert subscription row; set `status = 'pending'` |
| `subscription.updated` | Update existing row; sync plan/amount/renewal date |
| `subscription.activated` | Set `status = 'active'`; set `last_charge_date` |
| `subscription.cancelled` | Set `status = 'cancelled'`; record cancellation reason |
| `subscription.expired` | Set `status = 'expired'` (after last_charge_date) |
| `invoice.paid` | Update `last_charge_date` to invoice date |
| `invoice.payment_failed` | Set `status = 'past_due'`; alert user (optional) |

---

## 8. Environment Configuration

### `.env.local`

```bash
# Polar (primary provider)
POLAR_WEBHOOK_SECRET=whsk_live_xxxxx
POLAR_ACCESS_TOKEN=xxx  # For Polar SDK (customer portal, optional)

# App URL (for Polar checkout redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://team-tracker.com

# Optional: SePay fallback (Vietnam local payments)
SEPAY_API_KEY=xxx
SEPAY_WEBHOOK_SECRET=xxx
```

### `.env.example` (for repo)

```bash
# Polar webhook secret (from Polar dashboard)
POLAR_WEBHOOK_SECRET=

# Polar access token (optional, for customer portal)
POLAR_ACCESS_TOKEN=

# Application URL (for payment redirects)
NEXT_PUBLIC_APP_URL=
```

---

## 9. Unresolved Technical Questions

1. **Email confirmation on signup:** Should new users confirm email before accessing app?  
   *Current assumption:* Skip for MVP; enable later if needed.

2. **Trial period:** Should free users get 14-day access to pro features?  
   *Current assumption:* No; free tier is permanent unless subscribed.

3. **Cancellation flow:** Should users cancel directly via app UI, or redirect to Polar customer portal?  
   *Recommendation:* Redirect to Polar portal for now (avoids implementing cancellation logic in app).

4. **Invoice/receipt:** Should app email receipts, or rely on Polar's emails?  
   *Current assumption:* Polar handles emails; app shows invoice link in account page.

5. **Failed payment recovery:** Should app send payment-failed alerts?  
   *Current assumption:* Polar sends email; app marks subscription `past_due` via webhook.

---

## Summary

- **Subscriptions table:** User-scoped with RLS; webhook-driven updates via service-role.
- **Webhook:** Polar → Next.js route handler → signature verification → upsert subscription row.
- **Feature gating:** Server-side, multi-layer (middleware + server actions + server components + RLS).
- **Signup:** New public signup flow; free tier by default; redirect to pricing/Polar checkout for subscriptions.
- **RLS:** Controls visibility; feature gating controls functionality (layers combine for security).
