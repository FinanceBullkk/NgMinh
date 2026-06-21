import Link from "next/link";
import type { EmployeeCard, Tag } from "@/lib/types/models";
import { SentimentSparkline } from "@/components/sparkline/sentiment-sparkline";
import { TagEditor } from "@/components/employee/tag-editor";
import { ClosenessSlider } from "./closeness-slider";

export function ProfileHeader({
  employee,
  allTags,
}: {
  employee: EmployeeCard;
  allTags: Tag[];
}) {
  const subtitle = [employee.role_title, employee.team].filter(Boolean).join(" · ");
  return (
    <header className="flex flex-col gap-3 border-b border-zinc-200 p-4">
      <Link href="/" className="text-sm text-zinc-500">
        ← Roster
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
      <SentimentSparkline colors={employee.sentimentColors} />
      <ClosenessSlider employeeId={employee.id} initial={employee.closeness} />
      <TagEditor employee={employee} allTags={allTags} />
    </header>
  );
}
