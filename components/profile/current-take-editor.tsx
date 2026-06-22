"use client";

import { useEffect, useRef, useState } from "react";
import { updateCurrentTake } from "@/app/(app)/actions/employees";
import { invalidate } from "@/lib/cache";

type Status = "idle" | "saving" | "saved";

// Revise (spec §2.1): overwrite-in-place with debounced auto-save + flush on blur/unmount.
export function CurrentTakeEditor({
  employeeId,
  initial,
}: {
  employeeId: string;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initial);
  const saved = useRef(initial);

  const save = async () => {
    if (latest.current === saved.current) return;
    const v = latest.current;
    setStatus("saving");
    const res = await updateCurrentTake(employeeId, v);
    if (!res.error) {
      saved.current = v;
      setStatus("saved");
      // Refresh SWR profile cache so current_take stays in sync after the debounced save.
      void invalidate.takeOrCloseness(employeeId);
    } else {
      setStatus("idle");
    }
  };

  const onChange = (v: string) => {
    setValue(v);
    latest.current = v;
    setStatus("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 800);
  };

  // Flush on unmount (fire-and-forget; no setState after unmount).
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (latest.current !== saved.current) {
        void updateCurrentTake(employeeId, latest.current);
      }
    };
  }, [employeeId]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor="current-take" className="text-sm font-medium">
          Nhận định hiện tại
        </label>
        <span className="text-xs text-zinc-400">
          {status === "saving" ? "đang lưu…" : status === "saved" ? "đã lưu" : ""}
        </span>
      </div>
      <textarea
        id="current-take"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (timer.current) clearTimeout(timer.current);
          void save();
        }}
        rows={4}
        placeholder="Ghi quan sát cụ thể (vd: 'trễ deadline X 2 lần tháng này') hơn là nhãn cảm tính ('lười')."
        className="w-full resize-y rounded-md border border-zinc-300 p-3 text-base"
      />
    </div>
  );
}
