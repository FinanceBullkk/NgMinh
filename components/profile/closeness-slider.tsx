"use client";

import { useState, useTransition } from "react";
import { updateCloseness } from "@/app/(app)/actions/employees";
import { closenessLabel } from "@/lib/utils/closeness";

export function ClosenessSlider({
  employeeId,
  initial,
}: {
  employeeId: string;
  initial: number | null;
}) {
  const [value, setValue] = useState(initial ?? 3);
  const [, start] = useTransition();
  const save = () => start(() => void updateCloseness(employeeId, value));

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-500">Gần gũi</span>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onMouseUp={save}
        onTouchEnd={save}
        className="flex-1 accent-[#3f8f6b]"
      />
      <span className="w-16 text-right text-sm">{closenessLabel(value)}</span>
    </div>
  );
}
