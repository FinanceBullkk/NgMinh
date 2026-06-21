"use client";

import Link from "next/link";
import type { EmployeeCard } from "@/lib/types/models";
import { SparklineSlot } from "@/components/sparkline/sparkline-slot";
import { closenessLabel } from "@/lib/utils/closeness";

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

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-medium">
            <Link href={`/employees/${e.id}`} className="hover:underline">
              {e.name}
            </Link>
          </h3>
          {subtitle && <p className="truncate text-xs text-zinc-500">{subtitle}</p>}
        </div>
        <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {closenessLabel(e.closeness)}
        </span>
      </div>

      <SparklineSlot colors={e.sentimentColors} />

      {e.current_take && (
        <p className="line-clamp-2 text-sm text-zinc-700">{e.current_take}</p>
      )}

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

      <div className="mt-1 flex gap-3 text-xs">
        <button onClick={onEdit} className="text-[#3f8f6b]">
          Sửa
        </button>
        <button onClick={onDelete} className="text-red-600">
          Xoá
        </button>
      </div>
    </div>
  );
}
