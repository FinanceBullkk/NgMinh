import { listAllSentimentOptions } from "@/lib/data/sentiment";
import { listTags } from "@/lib/data/tags";
import { SentimentManager } from "@/components/settings/sentiment-manager";
import { TagManager } from "@/components/settings/tag-manager";
import { DataControls } from "@/components/settings/data-controls";

// Settings page: sentiment config + tag management + data controls.
// Desktop (≥ lg): centered column max-w-[720px]. Mobile: full-width column with p-4.
export default async function SettingsPage() {
  const [sentiments, tags] = await Promise.all([
    listAllSentimentOptions(),
    listTags(),
  ]);
  return (
    <main className="flex flex-col gap-8 p-4 lg:mx-auto lg:max-w-[720px] lg:px-7 lg:py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SentimentManager initial={sentiments} />
      <TagManager initial={tags} />
      <DataControls />
    </main>
  );
}
