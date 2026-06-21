import { notFound } from "next/navigation";
import { getEmployee, getEmployeeTagIds } from "@/lib/data/employees";
import { listTags } from "@/lib/data/tags";
import { listGoalsByEmployee } from "@/lib/data/goals";
import { listEntriesByEmployee } from "@/lib/data/entries";
import { listAllSentimentOptions } from "@/lib/data/sentiment";
import { ProfileHeader } from "@/components/profile/profile-header";
import { CurrentTakeEditor } from "@/components/profile/current-take-editor";
import { GoalsSection } from "@/components/profile/goals-section";
import { TimelineList } from "@/components/profile/timeline-list";
import { QuickAdd } from "@/components/quick-add/quick-add-sheet";
import type { EmployeeCard, TimelineEntry } from "@/lib/types/models";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const [allTags, tagIds, goals, entries, allSentiments] = await Promise.all([
    listTags(),
    getEmployeeTagIds(id),
    listGoalsByEmployee(id),
    listEntriesByEmployee(id),
    listAllSentimentOptions(),
  ]);

  const tagSet = new Set(tagIds);
  const tags = allTags.filter((t) => tagSet.has(t.id));
  const sentMap = new Map(
    allSentiments.map((s) => [s.id, { label: s.label, color: s.color }]),
  );

  const timeline: TimelineEntry[] = entries.map((e) => ({
    ...e,
    sentiment: e.sentiment_id ? (sentMap.get(e.sentiment_id) ?? null) : null,
  }));

  // Sparkline wants oldest → newest; entries arrive newest-first.
  const sentimentColors = entries
    .map((e) => (e.sentiment_id ? sentMap.get(e.sentiment_id)?.color : undefined))
    .filter((c): c is string => Boolean(c))
    .reverse()
    .slice(-20);

  const activeSentiments = allSentiments.filter((s) => !s.is_archived);
  const card: EmployeeCard = { ...employee, tags, sentimentColors };

  return (
    <div className="flex flex-col">
      <ProfileHeader employee={card} allTags={allTags} />
      <div className="p-4">
        <CurrentTakeEditor
          employeeId={employee.id}
          initial={employee.current_take ?? ""}
        />
      </div>
      <GoalsSection employeeId={employee.id} goals={goals} />
      <div className="px-4">
        <QuickAdd employeeId={employee.id} sentiments={activeSentiments} big />
      </div>
      <TimelineList entries={timeline} sentiments={activeSentiments} />
    </div>
  );
}
