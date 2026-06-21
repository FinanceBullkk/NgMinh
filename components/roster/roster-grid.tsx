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
    <div className="flex flex-col gap-4 p-4 lg:px-8 lg:py-6">
      {/*
       * Top bar
       * Mobile: H1 + add button stacked in a single row (existing behaviour).
       * Desktop (≥ lg): H1 + muted count on the left; search input + add button on the right.
       * The RosterSearch component is hidden in the mobile top bar (appears below instead).
       */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        {/* Left: title + count */}
        <div className="flex items-center justify-between gap-2 lg:justify-start lg:gap-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Roster</h1>
            <span className="text-sm text-zinc-400">
              {employees.length} nhân viên
            </span>
          </div>

          {/* "+ Nhân viên" button — shown in the left group on mobile only */}
          <button
            onClick={() => setDialog({ mode: "new", employee: null })}
            className="rounded-md bg-[#3f8f6b] px-3 py-2 text-sm font-medium text-white lg:hidden"
          >
            + Nhân viên
          </button>
        </div>

        {/* Right: search (desktop width controlled inside RosterSearch) + add button */}
        <div className="flex items-center gap-3">
          {/* Search is always rendered; on mobile it spans full width, on desktop it has fixed width */}
          <div className="flex-1 lg:flex-none">
            <RosterSearch value={query} onChange={setQuery} />
          </div>

          {/* "+ Nhân viên" button — desktop only */}
          <button
            onClick={() => setDialog({ mode: "new", employee: null })}
            className="hidden shrink-0 rounded-md bg-[#3f8f6b] px-3 py-2 text-sm font-medium text-white lg:flex lg:items-center lg:gap-1"
          >
            + Nhân viên
          </button>
        </div>
      </div>

      {/* Tag filter chips */}
      <TagFilterBar tags={tags} selected={selectedTags} onToggle={toggleTag} />

      {/* Daily reminder banner */}
      {!hasEntryToday && employees.length > 0 && (
        <DailyReminder
          employees={employees.map((e) => ({ id: e.id, name: e.name }))}
          sentiments={sentiments}
        />
      )}

      {/* Card grid: 1 col mobile → 2 col sm → 3 col xl */}
      {visible.length === 0 ? (
        <EmptyRoster
          onAdd={() => setDialog({ mode: "new", employee: null })}
          filtered={employees.length > 0}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
