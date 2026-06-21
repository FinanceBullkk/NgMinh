"use client";

import { useState } from "react";
import type { Tag } from "@/lib/types/models";

export function TagManagerRow({
  tag,
  disabled,
  onRename,
  onDelete,
}: {
  tag: Tag;
  disabled: boolean;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);

  if (editing) {
    return (
      <li className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
        />
        <button
          disabled={disabled || !name.trim()}
          onClick={() => {
            onRename(tag.id, name.trim());
            setEditing(false);
          }}
          className="text-xs text-[#3f8f6b]"
        >
          Lưu
        </button>
        <button
          onClick={() => {
            setName(tag.name);
            setEditing(false);
          }}
          className="text-xs text-zinc-400"
        >
          Huỷ
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      <span className="flex-1 text-sm">{tag.name}</span>
      <button disabled={disabled} onClick={() => setEditing(true)} className="text-xs text-zinc-500">
        Sửa
      </button>
      <button disabled={disabled} onClick={() => onDelete(tag.id)} className="text-xs text-red-600">
        Xoá
      </button>
    </li>
  );
}
