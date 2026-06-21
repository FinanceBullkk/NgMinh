"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { EmployeeCard, SentimentOption, Tag } from "@/lib/types/models";
import { EmployeeCardView } from "./employee-card";
import { TagFilterBar } from "./tag-filter-bar";
import { RosterSearch } from "./roster-search";
import { EmptyRoster } from "./empty-roster";
import { DailyReminder } from "./daily-reminder";
import { EmployeeFormDialog } from "@/components/employee/employee-form-dialog";
import {
  deleteEmployee,
  searchEmployeeIdsByContent,
} from "@/app/(app)/actions/employees";

type DialogState = { mode: "new" | "edit"; employee: EmployeeCard | null } | null;

// Nudged employees float to the top (cooling outranks stale-1:1).
const nudgeScore = (e: EmployeeCard) =>
  (e.nudges.cooling ? 2 : 0) + (e.nudges.stale1on1 ? 1 : 0);

export function RosterGrid({
  employees,
  tags,
  sentiments,
  hasEntryToday,
}: {
  employees: EmployeeCard[];
  tags: Tag[];
  sentiments: SentimentOption[];
  hasEntryToday: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [contentIds, setContentIds] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState>(null);
  const [, startDelete] = useTransition();

  // Debounced server-side content search; name + tags filter happens client-side.
  // All setState happens inside the timeout (never synchronously in the effect body).
  useEffect(() => {
    const q = query.trim();
    const id = setTimeout(async () => {
      if (q.length < 2) {
        setContentIds(new Set());
        return;
      }
      try {
        setContentIds(new Set(await searchEmployeeIdsByContent(q)));
      } catch {
        // ignore transient search errors
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = employees.filter((e) => {
      if (selectedTags.size && !e.tags.some((t) => selectedTags.has(t.id)))
        return false;
      if (q && !e.name.toLowerCase().includes(q) && !contentIds.has(e.id))
        return false;
      return true;
    });
    // Stable sort: nudged first, otherwise keep the name order from the query.
    return [...filtered].sort((a, b) => nudgeScore(b) - nudgeScore(a));
  }, [employees, query, selectedTags, contentIds]);

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onDelete = (e: EmployeeCard) => {
    if (
      !window.confirm(
        `Xoá "${e.name}"? Mọi note, goal và tag liên quan sẽ bị xoá theo.`,
      )
    )
      return;
    startDelete(() => {
      void deleteEmployee(e.id);
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Roster</h1>
        <button
          onClick={() => setDialog({ mode: "new", employee: null })}
          className="rounded-md bg-[#3f8f6b] px-3 py-2 text-sm font-medium text-white"
        >
          + Nhân viên
        </button>
      </div>

      {!hasEntryToday && employees.length > 0 && (
        <DailyReminder
          employees={employees.map((e) => ({ id: e.id, name: e.name }))}
          sentiments={sentiments}
        />
      )}

      <RosterSearch value={query} onChange={setQuery} />
      <TagFilterBar tags={tags} selected={selectedTags} onToggle={toggleTag} />

      {visible.length === 0 ? (
        <EmptyRoster
          onAdd={() => setDialog({ mode: "new", employee: null })}
          filtered={employees.length > 0}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((e) => (
            <EmployeeCardView
              key={e.id}
              employee={e}
              onEdit={() => setDialog({ mode: "edit", employee: e })}
              onDelete={() => onDelete(e)}
            />
          ))}
        </div>
      )}

      {dialog && (
        <EmployeeFormDialog
          mode={dialog.mode}
          employee={dialog.employee}
          allTags={tags}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
