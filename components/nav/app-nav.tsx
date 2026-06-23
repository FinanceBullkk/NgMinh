"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "@/app/(app)/actions/sign-out";
import { QuickAdd } from "@/components/quick-add/quick-add-sheet";

// Mobile-first bottom nav: icon tabs with an active state, a center FAB that opens
// quick-add from any screen, and sign-out tucked under an Account tab (off the nav row).
export function AppNav() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <nav className="sticky bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="relative mx-auto flex h-[68px] max-w-md items-stretch justify-between px-6 pt-2">
        <NavTab href="/" label="Roster" active={isActive("/")} icon={<RosterIcon />} />
        <NavTab href="/feed" label="Feed" active={isActive("/feed")} icon={<FeedIcon />} />
        <div className="w-12" aria-hidden />
        <NavTab href="/settings" label="Settings" active={isActive("/settings")} icon={<SettingsIcon />} />
        <AccountTab />

        <QuickAdd
          lazy
          renderTrigger={(open) => (
            <button
              onClick={open}
              aria-label="Ghi nhanh"
              className="absolute left-1/2 top-0 flex h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-[#3f8f6b] text-white shadow-[0_8px_22px_rgba(63,143,107,0.45)]"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        />
      </div>
    </nav>
  );
}

function NavTab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="flex w-13 flex-col items-center gap-0.5"
      style={{ color: active ? "#3f8f6b" : "#a1a1aa" }}
    >
      {icon}
      <span className="text-[10.5px] font-semibold">{label}</span>
    </Link>
  );
}

// Account tab: a small popover holding sign-out, so it doesn't crowd the nav row.
function AccountTab() {
  const [open, setOpen] = useState(false);

  // Keyboard-dismissible popover: close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative flex w-13 flex-col items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex flex-col items-center gap-0.5"
        style={{ color: open ? "#3f8f6b" : "#a1a1aa" }}
      >
        <AccountIcon />
        <span className="text-[10.5px] font-semibold">Tài khoản</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute bottom-12 right-0 z-50 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
            <form action={signOut}>
              <button
                type="submit"
                className="whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function RosterIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <line x1="4" y1="8" x2="20" y2="8" />
      <circle cx="15" cy="8" r="2.4" fill="#fff" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <circle cx="9" cy="16" r="2.4" fill="#fff" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c0-3.6 3.2-6 7.5-6s7.5 2.4 7.5 6" />
    </svg>
  );
}
