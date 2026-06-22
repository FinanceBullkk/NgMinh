"use client";

import { useState, useTransition } from "react";
import { createGoal } from "@/app/(app)/actions/goals";
import type { Goal, GoalStatus } from "@/lib/types/models";
import { GoalItem } from "./goal-item";
import { invalidate } from "@/lib/cache";

export function GoalsSection({
  employeeId,
  goals: initial,
}: {
  employeeId: string;
  goals: Goal[];
}) {
  const [goals, setGoals] = useState<Goal[]>(initial);
  const [content, setContent] = useState("");
  const [pending, start] = useTransition();

  // Sync with fresh SWR data: when the prop changes (background revalidate after a write),
  // adopt it instead of staying frozen at mount (the bug class that bit feed-list).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setGoals(initial);
  }

  const add = () => {
    const c = content.trim();
    if (!c) return;
    start(async () => {
      const res = await createGoal(employeeId, c);
      if ("goal" in res) {
        setGoals((prev) => [res.goal, ...prev]);
        setContent("");
        // Revalidate profile SWR cache so ReviewPack + any goal-derived data refreshes.
        void invalidate.goal(employeeId);
      }
    });
  };

  const onStatusChange = (id: string, status: GoalStatus) =>
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));

  return (
    <section className="flex flex-col gap-2 p-4">
      <h2 className="text-sm font-medium">Goals</h2>
      <ul className="flex flex-col gap-1">
        {goals.map((g) => (
          <GoalItem key={g.id} goal={g} employeeId={employeeId} onStatusChange={(s) => onStatusChange(g.id, s)} />
        ))}
        {goals.length === 0 && (
          <li className="text-xs text-zinc-400">Chưa có goal.</li>
        )}
      </ul>
      <div className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Thêm goal…"
          className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
        <button
          onClick={add}
          disabled={pending || !content.trim()}
          className="rounded-md bg-zinc-800 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Thêm
        </button>
      </div>
    </section>
  );
}
