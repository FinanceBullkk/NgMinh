"use client";

export type FeedViewMode = "list" | "calendar";

// Segmented control switching the by-time axis between the stream (List) and the grid
// (Calendar). Both render the same filtered dataset — this only changes the presentation.
export function ViewToggle({
  view,
  onChange,
}: {
  view: FeedViewMode;
  onChange: (v: FeedViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 p-0.5" role="tablist" aria-label="Kiểu xem">
      <Btn active={view === "list"} onClick={() => onChange("list")} label="Danh sách">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      </Btn>
      <Btn active={view === "calendar"} onClick={() => onChange("calendar")} label="Lịch">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
      </Btn>
    </div>
  );
}

function Btn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        active ? "bg-[#3f8f6b] text-white" : "text-zinc-500 hover:text-zinc-800"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
