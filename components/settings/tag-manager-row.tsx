"use client";

// TagManagerRow is no longer used — tag display was moved inline into TagManager
// as chip components. This file is kept to avoid breaking any future imports.
// Remove in a future cleanup pass if confirmed unused.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TagManagerRow(_: {
  tag: { id: string; name: string; user_id: string };
  disabled: boolean;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  return null;
}
