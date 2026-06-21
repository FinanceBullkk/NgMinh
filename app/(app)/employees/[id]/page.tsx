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
import { ClosenessSlider } from "@/components/profile/closeness-slider";
import type { EmployeeCard, TimelineEntry } from "@/lib/types/models";
import { buildSentimentColorSeries } from "@/lib/utils/sparkline-points";
import { computeNudges } from "@/lib/utils/nudges";
import { ReviewPack } from "@/components/profile/review-pack";

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

  const sentimentColors = buildSentimentColorSeries(entries, allSentiments);

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
  const card: EmployeeCard = { ...employee, tags, sentimentColors, nudges };

  // First name used in desktop quick-add button label.
  const firstName = employee.name.trim().split(/\s+/)[0];

  // Desktop header right column: "Ghi cho {firstName}" green button + closeness pips.
  // Visible only at lg+ (the header hides this slot on mobile via lg:hidden / hidden lg:flex).
  const desktopAction = (
    <>
      <QuickAdd
        employeeId={employee.id}
        sentiments={activeSentiments}
        triggerLabel={`Ghi cho ${firstName}`}
      />
      <ClosenessSlider
        employeeId={employee.id}
        initial={employee.closeness}
        variant="pips"
      />
    </>
  );

  return (
    <div className="flex flex-col">
      <ProfileHeader employee={card} allTags={allTags} desktopAction={desktopAction} />

      {/* Mobile sticky quick-add — hidden at lg (desktop uses the header button instead).
          Keep accessible name "+ Ghi hôm nay" for e2e tests that target this label. */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <QuickAdd employeeId={employee.id} sentiments={activeSentiments} big />
      </div>

      {/* Body: single column on mobile; two columns at lg (left wider, right timeline). */}
      <div className="p-4 lg:flex lg:items-start lg:gap-6 lg:px-7 lg:py-5">
        {/* Left column: CurrentTake + Goals + ReviewPack */}
        <div className="flex flex-col gap-0 lg:flex-[1.35]">
          <div className="lg:py-0">
            <CurrentTakeEditor
              employeeId={employee.id}
              initial={employee.current_take ?? ""}
            />
          </div>
          <GoalsSection employeeId={employee.id} goals={goals} />
          <ReviewPack employeeName={employee.name} entries={timeline} goals={goals} />
        </div>

        {/* Right column: Timeline — stacks below on mobile, beside on desktop */}
        <div className="mt-4 lg:mt-0 lg:flex-1">
          <TimelineList entries={timeline} />
        </div>
      </div>
    </div>
  );
}
