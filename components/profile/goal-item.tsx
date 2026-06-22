"use client";

import { useTransition } from "react";
import { updateGoalStatus } from "@/app/(app)/actions/goals";
import type { Goal, GoalStatus } from "@/lib/types/models";
import { invalidate } from "@/lib/cache";

export function GoalItem({
  goal,
  employeeId,
  onStatusChange,
}: {
  goal: Goal;
  // Needed to revalidate the SWR profile cache after a status change so ReviewPack refreshes.
  employeeId: string;
  onStatusChange: (status: GoalStatus) => void;
}) {
  const [pending, start] = useTransition();
  const set = (s: GoalStatus) =>
    start(async () => {
      const res = await updateGoalStatus(goal.id, s);
      if (!res.error) {
        onStatusChange(s);
        void invalidate.goal(employeeId);
      }
    });

  const muted = goal.status !== "open";
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span
        className={
          goal.status === "done"
            ? "text-zinc-400 line-through"
            : muted
              ? "text-zinc-400"
              : ""
        }
      >
        {goal.content}
      </span>
      <span className="flex shrink-0 gap-2 text-xs">
        {goal.status !== "done" && (
          <button disabled={pending} onClick={() => set("done")} className="text-[#3f8f6b]">
            ✓ Xong
          </button>
        )}
        {goal.status !== "open" && (
          <button disabled={pending} onClick={() => set("open")} className="text-zinc-500">
            ↺ Mở lại
          </button>
        )}
        {goal.status !== "dropped" && (
          <button disabled={pending} onClick={() => set("dropped")} className="text-zinc-400">
            ✕ Bỏ
          </button>
        )}
      </span>
    </li>
  );
}
