"use client";

// Search input with leading magnifier icon. On desktop the parent controls its width
// (rendered inline in the top bar via a flex container). On mobile it spans full width.
export function RosterSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative w-full lg:w-[280px]">
      {/* Magnifier icon */}
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm tên hoặc nội dung note…"
        className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none"
      />
    </div>
  );
}
