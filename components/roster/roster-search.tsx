"use client";

export function RosterSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Tìm theo tên hoặc nội dung note…"
      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base"
    />
  );
}
