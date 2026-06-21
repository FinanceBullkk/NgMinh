"use client";

import { useState, useTransition } from "react";
import { renameTag, deleteTag } from "@/app/(app)/actions/tags";
import type { Tag } from "@/lib/types/models";
import { TagManagerRow } from "./tag-manager-row";

export function TagManager({ initial }: { initial: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const onRename = (id: string, name: string) =>
    start(async () => {
      const res = await renameTag(id, name);
      if (res.error) return setError(res.error);
      setTags((p) => p.map((t) => (t.id === id ? { ...t, name } : t)));
      setError("");
    });

  const onDelete = (id: string) => {
    if (!window.confirm("Xoá tag này? Sẽ gỡ khỏi mọi nhân viên.")) return;
    start(async () => {
      const res = await deleteTag(id);
      if (res.error) return setError(res.error);
      setTags((p) => p.filter((t) => t.id !== id));
      setError("");
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Tags</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {tags.length === 0 ? (
        <p className="text-xs text-zinc-400">Chưa có tag.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tags.map((t) => (
            <TagManagerRow
              key={t.id}
              tag={t}
              disabled={pending}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
