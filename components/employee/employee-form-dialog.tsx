"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import {
  createEmployee,
  updateEmployee,
  type ActionState,
} from "@/app/(app)/actions/employees";
import { TagEditor } from "@/components/employee/tag-editor";
import type { EmployeeCard, Tag } from "@/lib/types/models";

const inputCls = "rounded-md border border-zinc-300 px-3 py-2 text-base";

export function EmployeeFormDialog({
  mode,
  employee,
  allTags,
  onClose,
}: {
  mode: "new" | "edit";
  employee: EmployeeCard | null;
  allTags: Tag[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const action = mode === "edit" ? updateEmployee : createEmployee;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );

  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="employee-form-title"
      className="m-auto w-[min(92vw,28rem)] rounded-lg p-0 backdrop:bg-black/40"
    >
      <form action={formAction} className="flex flex-col gap-3 p-5">
        <h2 id="employee-form-title" className="text-lg font-semibold">
          {mode === "edit" ? "Edit employee" : "New employee"}
        </h2>

        {mode === "edit" && employee && (
          <input type="hidden" name="id" defaultValue={employee.id} />
        )}

        <Field label="Name *">
          <input name="name" required defaultValue={employee?.name ?? ""} className={inputCls} />
        </Field>
        <Field label="Role">
          <input name="role_title" defaultValue={employee?.role_title ?? ""} className={inputCls} />
        </Field>
        <Field label="Team">
          <input name="team" defaultValue={employee?.team ?? ""} className={inputCls} />
        </Field>
        <Field label="Start date">
          <input type="date" name="start_date" defaultValue={employee?.start_date ?? ""} className={inputCls} />
        </Field>
        <Field label="Closeness (1–5)">
          <input
            type="number"
            name="closeness"
            min={1}
            max={5}
            defaultValue={employee?.closeness ?? 3}
            className={inputCls}
          />
        </Field>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="px-3 py-2 text-sm text-zinc-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[#3f8f6b] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {mode === "edit" && employee && (
        <div className="border-t border-zinc-200 p-5">
          <TagEditor employee={employee} allTags={allTags} />
        </div>
      )}
    </dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
    </label>
  );
}
