"use client";

import { useSWRConfig } from "swr";
import type { ReactNode } from "react";
import { signOut } from "@/app/(app)/actions/sign-out";

// Sign out AND drop the entire client SWR cache, so a different account signing in on the same
// browser can never momentarily see the previous user's cached roster/feed (multi-user safety).
// The server action clears the auth cookie + redirects; clearing the cache here covers the
// shared-browser window before the next login forces a full reload.
export function SignOutButton({
  className,
  ariaLabel,
  children,
}: {
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const { mutate } = useSWRConfig();
  return (
    <form
      action={signOut}
      onSubmit={() => {
        // Match every key, set to undefined, no revalidate → wipes the cache.
        void mutate(() => true, undefined, { revalidate: false });
      }}
    >
      <button type="submit" aria-label={ariaLabel} className={className}>
        {children}
      </button>
    </form>
  );
}
