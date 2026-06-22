"use client";

import { useState, useTransition } from "react";
import { updateCloseness } from "@/app/(app)/actions/employees";
import { closenessLabel } from "@/lib/utils/closeness";
import { revalidateKey } from "@/lib/swr-revalidate";

// variant="slider" (default): full-width range slider used in the mobile header.
// variant="pips":  compact pip row used in the desktop header right column.
export function ClosenessSlider({
  employeeId,
  initial,
  variant = "slider",
}: {
  employeeId: string;
  initial: number | null;
  variant?: "slider" | "pips";
}) {
  const [value, setValue] = useState(initial ?? 3);
  const [, start] = useTransition();
  // After the action resolves, revalidate the SWR profile cache so closeness propagates.
  const save = (v: number) =>
    start(async () => {
      await updateCloseness(employeeId, v);
      void revalidateKey(`profile:${employeeId}`);
    });

  if (variant === "pips") {
    // Desktop compact: "Mức hiểu ● ● ● ○ ○  Vừa"
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500">Mức hiểu</span>
        <div className="flex items-center gap-1" role="group" aria-label="Mức hiểu">
          {[1, 2, 3, 4, 5].map((pip) => (
            <button
              key={pip}
              type="button"
              aria-label={`Mức ${pip}`}
              aria-pressed={pip <= value}
              onClick={() => {
                setValue(pip);
                save(pip);
              }}
              className={`h-3 w-3 rounded-full border transition-colors ${
                pip <= value
                  ? "border-[#3f8f6b] bg-[#3f8f6b]"
                  : "border-zinc-300 bg-white"
              }`}
            />
          ))}
        </div>
        <span className="min-w-[3.5rem] text-xs text-zinc-600">{closenessLabel(value)}</span>
      </div>
    );
  }

  // Default: range slider (mobile header)
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-500">Gần gũi</span>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onMouseUp={() => save(value)}
        onTouchEnd={() => save(value)}
        className="flex-1 accent-[#3f8f6b]"
      />
      <span className="w-16 text-right text-sm">{closenessLabel(value)}</span>
    </div>
  );
}
