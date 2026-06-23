"use client";

// Client-rendered Profile: browser→Supabase (RLS-scoped), cached by SWR.
// Mirrors the same layout as the former SSR page but fed by fetchProfile().
// After any write the caller calls revalidateKey(`profile:${employeeId}`) so
// SWR refetches and all data-derived UI (sparkline, nudges, etc.) updates.

import { useEntry, cache } from "@/lib/cache";
import { ProfileHeader } from "@/components/profile/profile-header";
import { CurrentTakeEditor } from "@/components/profile/current-take-editor";
import { GoalsSection } from "@/components/profile/goals-section";
import { TimelineList } from "@/components/profile/timeline-list";
import { QuickAdd } from "@/components/quick-add/quick-add-sheet";
import { ClosenessSlider } from "@/components/profile/closeness-slider";
import { ReviewPack } from "@/components/profile/review-pack";

// ── Skeleton (shown on first load) ──────────────────────────────────────────
// Shape matches the real two-column layout so the page doesn't jump.
function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-zinc-200 p-4 lg:px-7 lg:py-5">
        <div className="flex flex-col gap-3">
          <div className="h-3 w-16 rounded bg-zinc-200" />
          <div className="h-7 w-48 rounded bg-zinc-200" />
          <div className="h-3 w-32 rounded bg-zinc-100" />
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-5 w-16 rounded-full bg-zinc-100" />
            ))}
          </div>
        </div>
      </div>
      {/* Body skeleton */}
      <div className="p-4 lg:flex lg:gap-6 lg:px-7 lg:py-5">
        <div className="flex flex-col gap-4 lg:flex-[1.35]">
          <div className="h-28 w-full rounded-md bg-zinc-100" />
          <div className="h-24 w-full rounded-md bg-zinc-100" />
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:mt-0 lg:flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded bg-zinc-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export function ProfileView({ employeeId }: { employeeId: string }) {
  const { data, error } = useEntry(cache.profile(employeeId));

  if (error) {
    return (
      <p className="p-4 text-sm text-red-600">
        Could not load the profile. Try reloading the page.
      </p>
    );
  }

  if (!data) return <ProfileSkeleton />;

  if (!data.employee) {
    return (
      <p className="p-8 text-center text-sm text-zinc-500">
        Employee not found.
      </p>
    );
  }

  const { employee, card, allTags, goals, timeline, activeSentiments } = data;

  // First name for the desktop quick-add button label.
  const firstName = employee.name.trim().split(/\s+/)[0];

  // Desktop header right column: QuickAdd button + closeness pips (lg+ only).
  const desktopAction = (
    <>
      <QuickAdd
        employeeId={employee.id}
        sentiments={activeSentiments}
        triggerLabel={`Log for ${firstName}`}
      />
      <ClosenessSlider
        employeeId={employee.id}
        initial={employee.closeness}
        variant="pips"
      />
    </>
  );

  return (
    <div className="flex flex-col">
      <ProfileHeader employee={card} allTags={allTags} desktopAction={desktopAction} />

      {/* Mobile sticky quick-add — hidden at lg (desktop uses the header button).
          Keep accessible name "+ Log today" for e2e tests that target this label. */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <QuickAdd employeeId={employee.id} sentiments={activeSentiments} big />
      </div>

      {/* Body: single column mobile; two columns at lg (left wider, right timeline). */}
      <div className="p-4 lg:flex lg:items-start lg:gap-6 lg:px-7 lg:py-5">
        {/* Left column: CurrentTake + Goals + ReviewPack */}
        <div className="flex flex-col gap-0 lg:flex-[1.35]">
          <div className="lg:py-0">
            <CurrentTakeEditor
              employeeId={employee.id}
              initial={employee.current_take ?? ""}
            />
          </div>
          <GoalsSection employeeId={employee.id} goals={goals} />
          <ReviewPack employeeName={employee.name} entries={timeline} goals={goals} />
        </div>

        {/* Right column: Timeline — stacks below mobile, beside desktop */}
        <div className="mt-4 lg:mt-0 lg:flex-1">
          <TimelineList entries={timeline} />
        </div>
      </div>
    </div>
  );
}
