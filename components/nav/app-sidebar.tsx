"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/(app)/actions/sign-out";
import { QuickAdd } from "@/components/quick-add/quick-add-sheet";

// Desktop-only left sidebar (≥ lg): logo, global quick-add (⌘K), nav with active state,
// and the account/sign-out block at the bottom. Mobile uses the bottom nav instead.
export function AppSidebar({ userEmail }: { userEmail: string }) {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  const initial = (userEmail.trim()[0] ?? "M").toUpperCase();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-[#f7f7f4] p-3.5 lg:flex">
      <div className="flex items-center gap-2.5 px-1.5 pb-4 pt-0.5">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-[#3f8f6b] text-sm font-bold text-white">
          T
        </span>
        <span className="text-[14.5px] font-bold text-zinc-800">Team Tracker</span>
      </div>

      <QuickAdd
        lazy
        cmdK
        renderTrigger={(open) => (
          <button
            onClick={open}
            className="mb-4 flex items-center justify-between rounded-[10px] bg-[#3f8f6b] px-3 py-2.5 text-white"
          >
            <span className="flex items-center gap-2 text-[13.5px] font-semibold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ghi nhanh
            </span>
            <span className="rounded-[5px] bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold">⌘K</span>
          </button>
        )}
      />

      <nav className="flex flex-col gap-0.5">
        <NavItem href="/" label="Roster" active={isActive("/")} icon={<RosterIcon />} />
        <NavItem href="/feed" label="Feed" active={isActive("/feed")} icon={<FeedIcon />} />
        <NavItem href="/settings" label="Settings" active={isActive("/settings")} icon={<SettingsIcon />} />
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-zinc-200 pt-3">
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#2a6f97] text-xs font-bold text-white">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-zinc-800">{userEmail}</div>
          <div className="text-[11px] text-zinc-400">Quản lý</div>
        </div>
        <form action={signOut}>
          <button type="submit" aria-label="Đăng xuất" className="flex text-zinc-400 hover:text-zinc-700">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavItem({
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
      className={`flex items-center gap-3 rounded-[9px] px-2.5 py-2.5 text-[13.5px] ${
        active
          ? "bg-[#3f8f6b14] font-semibold text-[#2c6b50]"
          : "font-medium text-zinc-600 hover:bg-zinc-200/50"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function RosterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <line x1="4" y1="8" x2="20" y2="8" />
      <circle cx="15" cy="8" r="2.4" fill="#f7f7f4" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <circle cx="9" cy="16" r="2.4" fill="#f7f7f4" />
    </svg>
  );
}
