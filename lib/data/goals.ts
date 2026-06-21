import { createClient } from "@/lib/supabase/server";
import type { Goal } from "@/lib/types/models";

export async function listGoalsByEmployee(employeeId: string): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
