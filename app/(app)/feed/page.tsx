import { listFeedEntries } from "@/lib/data/entries";
import { listEmployees } from "@/lib/data/employees";
import { listTags, listEmployeeTagLinks } from "@/lib/data/tags";
import { listSentimentOptions } from "@/lib/data/sentiment";
import { FeedList } from "@/components/feed/feed-list";

const PAGE = 50;

// Feed (by-time): all entries across the roster, grouped by day.
export default async function FeedPage() {
  const [entries, employees, tags, links, sentiments] = await Promise.all([
    listFeedEntries(PAGE, 0),
    listEmployees(),
    listTags(),
    listEmployeeTagLinks(),
    listSentimentOptions(),
  ]);

  const tagsByEmployee: Record<string, string[]> = {};
  for (const l of links) (tagsByEmployee[l.employee_id] ??= []).push(l.tag_id);

  return (
    <FeedList
      initialEntries={entries}
      pageSize={PAGE}
      employees={employees.map((e) => ({ id: e.id, name: e.name }))}
      tags={tags}
      tagsByEmployee={tagsByEmployee}
      sentiments={sentiments}
    />
  );
}
