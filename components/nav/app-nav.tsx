import Link from "next/link";
import { signOut } from "@/app/(app)/actions/sign-out";

// Mobile-first bottom nav shell. Feed (Phase 6) and Settings (Phase 8) pages land later.
export function AppNav() {
  return (
    <nav className="sticky bottom-0 flex items-center justify-around border-t border-zinc-200 bg-white/90 px-2 py-2 text-sm backdrop-blur">
      <Link href="/" className="px-3 py-1">
        Roster
      </Link>
      <Link href="/feed" className="px-3 py-1">
        Feed
      </Link>
      <Link href="/settings" className="px-3 py-1">
        Settings
      </Link>
      <form action={signOut}>
        <button type="submit" className="px-3 py-1 text-zinc-500">
          Thoát
        </button>
      </form>
    </nav>
  );
}
