"use client";

export function EmptyRoster({
  onAdd,
  filtered,
}: {
  onAdd: () => void;
  filtered: boolean;
}) {
  if (filtered) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        Không có nhân viên khớp bộ lọc.
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-zinc-500">Chưa có nhân viên nào.</p>
      <button
        onClick={onAdd}
        className="rounded-md bg-[#3f8f6b] px-4 py-2 font-medium text-white"
      >
        + Nhân viên mới
      </button>
    </div>
  );
}
