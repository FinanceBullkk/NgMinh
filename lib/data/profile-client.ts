"use client";

// Client-side Profile data: the browser fetches DIRECTLY from Supabase (no SSR round-trip).
// Reproduces the logic in app/(app)/employees/[id]/page.tsx but runs in the browser.
// RLS scopes every query to the current user, identical to the server queries.

import { createClient } from "@/lib/supabase/client";
import { buildSentimentColorSeries } from "@/lib/utils/sparkline-points";
import { computeNudges } from "@/lib/utils/nudges";
import type {
  Employee,
  EmployeeCard,
  Goal,
  SentimentOption,
  Tag,
  TimelineEntry,
} from "@/lib/types/models";

export type ProfileData = {
  employee: Employee | null;
  allTags: Tag[];
  tags: Tag[];           // tags assigned to this employee
  goals: Goal[];
  timeline: TimelineEntry[];
  activeSentiments: SentimentOption[];
  sentimentColors: string[];
  nudges: { stale1on1: boolean; cooling: boolean };
  card: EmployeeCard;
};

// One parallel round — fetches everything the Profile needs in a single fan-out.
// Returns null employee field when the employee is not found (caller shows not-found UI).
export async function fetchProfile(employeeId: string): Promise<ProfileData> {
  const supabase = createClient();

  // Fan out all independent queries simultaneously.
  const [empRes, allTagsRes, tagIdsRes, goalsRes, entriesRes, allSentimentsRes] =
    await Promise.all([
      // Single employee row (maybeSingle so it returns null, not error, when absent)
      supabase.from("employees").select("*").eq("id", employeeId).maybeSingle(),
      // All tags for the tag editor picker
      supabase.from("tags").select("*").order("name"),
      // Tag ids assigned to this employee
      supabase.from("employee_tags").select("tag_id").eq("employee_id", employeeId),
      // Goals newest-first
      supabase.from("goals").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }),
      // All entries for this employee, newest-first
      supabase
        .from("entries")
        .select("*")
        .eq("employee_id", employeeId)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false }),
      // All sentiment options (incl. archived — needed to render historical colors)
      supabase.from("sentiment_options").select("*").order("order_index").order("created_at"),
    ]);

  // Surface any DB error early so SWR can put it in the error slot.
  const dbErr =
    empRes.error ||
    allTagsRes.error ||
    tagIdsRes.error ||
    goalsRes.error ||
    entriesRes.error ||
    allSentimentsRes.error;
  if (dbErr) throw dbErr;

  const employee = empRes.data ?? null;
  const allTags: Tag[] = allTagsRes.data ?? [];
  const allSentiments: SentimentOption[] = allSentimentsRes.data ?? [];
  const entries = entriesRes.data ?? [];
  const goals: Goal[] = goalsRes.data ?? [];

  // Resolve which tags belong to this employee
  const tagSet = new Set((tagIdsRes.data ?? []).map((r) => r.tag_id));
  const tags = allTags.filter((t) => tagSet.has(t.id));

  // Attach resolved sentiment {label, color} to each entry (incl. archived options)
  const sentMap = new Map(
    allSentiments.map((s) => [s.id, { label: s.label, color: s.color }]),
  );
  const timeline: TimelineEntry[] = entries.map((e) => ({
    ...e,
    sentiment: e.sentiment_id ? (sentMap.get(e.sentiment_id) ?? null) : null,
  }));

  // Sparkline colors: oldest-to-newest, last 20 entries with a sentiment
  const sentimentColors = buildSentimentColorSeries(entries, allSentiments);

  // Nudge computation (spec §8): needs weight per sentiment_id
  const weightById = new Map(allSentiments.map((s) => [s.id, s.weight]));
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Saigon" });
  const nudges = computeNudges(
    entries.map((e) => ({
      type: e.type,
      entry_date: e.entry_date,
      weight: e.sentiment_id ? (weightById.get(e.sentiment_id) ?? null) : null,
    })),
    today,
  );

  const activeSentiments = allSentiments.filter((s) => !s.is_archived);

  // EmployeeCard: used by ProfileHeader (tags, sparkline, nudges)
  // When employee is null we still build a partial card-shape so callers compile cleanly;
  // the profile-view checks employee === null before rendering.
  const card: EmployeeCard = employee
    ? { ...employee, tags, sentimentColors, nudges }
    : // Fallback never rendered — profile-view bails on null employee.
      ({} as EmployeeCard);

  return {
    employee,
    allTags,
    tags,
    goals,
    timeline,
    activeSentiments,
    sentimentColors,
    nudges,
    card,
  };
}
