import type { ReactNode } from "react";
import Link from "next/link";
import type { EmployeeCard, Tag } from "@/lib/types/models";
import { SentimentSparkline } from "@/components/sparkline/sentiment-sparkline";
import { SentimentTrendChip } from "@/components/sentiment/sentiment-trend-chip";
import { TagEditor } from "@/components/employee/tag-editor";
import { ClosenessSlider } from "./closeness-slider";
import { avatarColor, avatarInitial } from "@/lib/utils/avatar-color";

// `desktopAction`: slot rendered in the desktop header right column only (≥ lg).
// On mobile the existing sticky QuickAdd + slider remain; on desktop they are hidden
// and replaced by this slot (QuickAdd button + ClosenessSlider pips).
export function ProfileHeader({
  employee,
  allTags,
  desktopAction,
}: {
  employee: EmployeeCard;
  allTags: Tag[];
  desktopAction?: ReactNode;
}) {
  const subtitle = [employee.role_title, employee.team].filter(Boolean).join(" · ");
  const bgColor = avatarColor(employee.id);
  const initial = avatarInitial(employee.name);

  return (
    <header className="border-b border-zinc-200 p-4 lg:px-7 lg:py-5">
      {/* ── Mobile layout (< lg): single column, same as before ── */}
      <div className="flex flex-col gap-3 lg:hidden">
        <Link href="/" className="text-sm text-zinc-500">
          ← Roster
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
          {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SentimentSparkline colors={employee.sentimentColors} />
          <SentimentTrendChip trend={employee.sentimentTrend} showInvite />
        </div>
        <ClosenessSlider employeeId={employee.id} initial={employee.closeness} variant="slider" />
        <TagEditor employee={employee} allTags={allTags} />
      </div>

      {/* ── Desktop layout (≥ lg): left info block + right action block ── */}
      <div className="hidden lg:flex lg:items-start lg:justify-between lg:gap-6">
        {/* Left: back link, avatar row, subtitle, tags */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Roster
          </Link>

          {/* Avatar + name + sparkline + caption in one row */}
          <div className="flex items-center gap-4">
            {/* 52px rounded-square avatar with brand green + white initial */}
            <span
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white"
              style={{ backgroundColor: bgColor }}
              aria-hidden
            >
              {initial}
            </span>

            <div className="flex flex-col gap-1">
              {/* Name + sparkline + caption inline */}
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
                <div className="flex items-center gap-2">
                  <SentimentSparkline colors={employee.sentimentColors} />
                  <SentimentTrendChip trend={employee.sentimentTrend} showInvite />
                </div>
              </div>
              {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
            </div>
          </div>

          {/* Tag chips inline at desktop */}
          <TagEditor employee={employee} allTags={allTags} />
        </div>

        {/* Right: desktop quick-add button + closeness pips — injected from page */}
        {desktopAction && (
          <div className="flex shrink-0 flex-col items-end gap-3">
            {desktopAction}
          </div>
        )}
      </div>
    </header>
  );
}
