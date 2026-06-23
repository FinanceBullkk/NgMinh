"use client";

import Link from "next/link";
import type { EmployeeCard } from "@/lib/types/models";
import { SentimentSparkline } from "@/components/sparkline/sentiment-sparkline";
import { SentimentTrendChip } from "@/components/sentiment/sentiment-trend-chip";
import { closenessLabel } from "@/lib/utils/closeness";
import { CardActionsMenu } from "./card-actions-menu";

// Closeness badge color mapping: darker text + tinted background per tier.
function closenessBadgeClass(value: number | null): string {
  const n = value ?? 0;
  if (n >= 4) return "bg-[#e8f5ef] text-[#2c6b50]";
  if (n >= 2) return "bg-zinc-100 text-zinc-600";
  return "bg-zinc-50 text-zinc-400";
}

export function EmployeeCardView({
  employee,
  onEdit,
  onDelete,
}: {
  employee: EmployeeCard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const e = employee;
  const subtitle = [e.role_title, e.team].filter(Boolean).join(" · ");
  const label = closenessLabel(e.closeness);
  const badgeCls = closenessBadgeClass(e.closeness);

  return (
    <div className="group flex flex-col gap-2 rounded-[14px] border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md">
      {/* Row 1: name + subtitle left; closeness badge + ⋯ menu right */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold leading-snug">
            <Link href={`/employees/${e.id}`} className="hover:underline">
              {e.name}
            </Link>
          </h3>
          {subtitle && (
            <p className="truncate text-xs text-zinc-500">{subtitle}</p>
          )}
        </div>

        {/* Closeness badge */}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}
        >
          {label}
        </span>

        {/* ⋯ overflow menu — replaces inline Sửa / Xoá text buttons */}
        <CardActionsMenu onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Row 2: stale-1:1 nudge (cooling is now shown by the trend chip below) */}
      {e.nudges.stale1on1 && (
        <div className="flex flex-wrap gap-1">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: "#fcefcf", color: "#92660a" }}
          >
            Lâu chưa 1:1
          </span>
        </div>
      )}

      {/* Row 3: sparkline + plain-language trend read-out */}
      <div className="flex items-center gap-2">
        <SentimentSparkline colors={e.sentimentColors} />
        <SentimentTrendChip trend={e.sentimentTrend} />
      </div>

      {/* Row 4: current take clamped to 2 lines */}
      {e.current_take && (
        <p className="line-clamp-2 text-sm text-zinc-700">{e.current_take}</p>
      )}

      {/* Row 5: tag chips */}
      {e.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {e.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
            >
              {t.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
