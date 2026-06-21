"use client";

import { useState, useTransition } from "react";
import { createTag, deleteTag } from "@/app/(app)/actions/tags";
import type { Tag } from "@/lib/types/models";

// TagManager: chip-style tag list + inline add input.
// Spec: card with existing tags as chips (each with ✕ remove), input "Tên tag mới…" + dark "Thêm" button.
// Note: rename is kept in the data layer but removed from this UI per the new spec design
// (chips don't have an edit mode; users delete + re-add to rename).
export function TagManager({ initial }: { initial: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");

  const onAdd = () => {
    const name = newName.trim();
    if (!name) return;
    start(async () => {
      const res = await createTag(name);
      if ("error" in res) return setError(res.error);
      // Only add to local list if it's a genuinely new tag (not a duplicate).
      setTags((prev) => {
        if (prev.some((t) => t.id === res.id)) return prev;
        return [...prev, { id: res.id, name, user_id: "", created_at: new Date(0).toISOString() }];
      });
      setNewName("");
      setError("");
    });
  };

  const onRemove = (id: string, name: string) => {
    if (!window.confirm(`Xoá tag "${name}"? Sẽ gỡ khỏi mọi nhân viên.`)) return;
    start(async () => {
      const res = await deleteTag(id);
      if (res.error) return setError(res.error);
      setTags((prev) => prev.filter((t) => t.id !== id));
      setError("");
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onAdd();
  };

  return (
    <section className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[15px] font-bold">Tags</h2>
        <p className="text-sm text-zinc-500">
          Dùng để gắn nhãn và lọc nhân viên trong Roster.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* White card: chips row + add input */}
      <div className="overflow-hidden rounded-[14px] border border-[#e4e4e7] bg-white">
        {/* Chips area — wraps naturally */}
        <div className="flex flex-wrap gap-2 p-3">
          {tags.length === 0 && (
            <span className="text-sm text-zinc-400">Chưa có tag.</span>
          )}
          {tags.map((t) => (
            <span
              key={t.id}
              className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm"
            >
              {t.name}
              <button
                type="button"
                disabled={pending}
                onClick={() => onRemove(t.id, t.name)}
                aria-label={`Xoá tag ${t.name}`}
                className="ml-0.5 text-zinc-400 transition-colors hover:text-zinc-700 disabled:opacity-40"
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        {/* Divider + add row */}
        <div className="flex items-center gap-2 border-t border-[#e4e4e7] px-3 py-2.5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tên tag mới…"
            aria-label="Tên tag mới"
            disabled={pending}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 disabled:opacity-50"
          />
          <button
            type="button"
            disabled={pending || !newName.trim()}
            onClick={onAdd}
            className="shrink-0 rounded-md bg-zinc-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            Thêm
          </button>
        </div>
      </div>
    </section>
  );
}
