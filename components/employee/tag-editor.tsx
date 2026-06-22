"use client";

import { useState, useTransition } from "react";
import {
  addTagToEmployee,
  removeTagFromEmployee,
  createTag,
} from "@/app/(app)/actions/tags";
import type { EmployeeCard, Tag } from "@/lib/types/models";
import { invalidate } from "@/lib/cache";

// Optimistic local tag list so edits feel live inside the open dialog;
// the server actions revalidate the roster behind it.
export function TagEditor({
  employee,
  allTags,
}: {
  employee: EmployeeCard;
  allTags: Tag[];
}) {
  const [tags, setTags] = useState<Tag[]>(employee.tags);
  const [newName, setNewName] = useState("");
  const [pending, start] = useTransition();

  const currentIds = new Set(tags.map((t) => t.id));
  const available = allTags.filter((t) => !currentIds.has(t.id));

  const add = (t: Tag) =>
    start(async () => {
      const res = await addTagToEmployee(employee.id, t.id);
      if (!res.error) {
        setTags((prev) => [...prev, t]);
        void invalidate.tag();
      }
    });

  const remove = (t: Tag) =>
    start(async () => {
      const res = await removeTagFromEmployee(employee.id, t.id);
      if (!res.error) {
        setTags((prev) => prev.filter((x) => x.id !== t.id));
        void invalidate.tag();
      }
    });

  const createAndAdd = () =>
    start(async () => {
      const res = await createTag(newName);
      if ("id" in res) {
        await addTagToEmployee(employee.id, res.id);
        setTags((prev) => [...prev, { ...allTagPlaceholder(res.id, newName) }]);
        setNewName("");
        void invalidate.tag();
      }
    });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Tags</p>

      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <button
            key={t.id}
            disabled={pending}
            onClick={() => remove(t)}
            className="rounded-full bg-[#3f8f6b] px-2 py-0.5 text-xs text-white disabled:opacity-50"
          >
            {t.name} ✕
          </button>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-zinc-400">Chưa có tag.</span>
        )}
      </div>

      {available.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {available.map((t) => (
            <button
              key={t.id}
              disabled={pending}
              onClick={() => add(t)}
              className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-600 disabled:opacity-50"
            >
              + {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Tag mới…"
          className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
        <button
          disabled={pending || !newName.trim()}
          onClick={createAndAdd}
          className="rounded-md bg-zinc-800 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Thêm
        </button>
      </div>
    </div>
  );
}

// Minimal Tag object for optimistic insert (full row arrives on revalidate).
function allTagPlaceholder(id: string, name: string): Tag {
  return {
    id,
    name: name.trim(),
    user_id: "",
    created_at: new Date(0).toISOString(),
  };
}
