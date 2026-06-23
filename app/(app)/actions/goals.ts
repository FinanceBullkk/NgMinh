"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Goal, GoalStatus } from "@/lib/types/models";

export async function createGoal(
  employeeId: string,
  content: string,
): Promise<{ goal: Goal } | { error: string }> {
  const c = content.trim();
  if (!c) return { error: "Content is empty." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data, error } = await supabase
    .from("goals")
    .insert({ employee_id: employeeId, content: c })
    .select("*")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/employees/${employeeId}`);
  return { goal: data };
}

export async function updateGoalStatus(
  goalId: string,
  status: GoalStatus,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data, error } = await supabase
    .from("goals")
    .update({ status })
    .eq("id", goalId)
    .select("employee_id")
    .single();
  if (error) return { error: error.message };

  if (data) revalidatePath(`/employees/${data.employee_id}`);
  return {};
}
