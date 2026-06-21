import { listAllSentimentOptions } from "@/lib/data/sentiment";
import { listTags } from "@/lib/data/tags";
import { SentimentManager } from "@/components/settings/sentiment-manager";
import { TagManager } from "@/components/settings/tag-manager";
import { DataControls } from "@/components/settings/data-controls";

// Settings: sentiment config (Phase 7) + tag management + data control (export/delete).
export default async function SettingsPage() {
  const [sentiments, tags] = await Promise.all([
    listAllSentimentOptions(),
    listTags(),
  ]);
  return (
    <main className="flex flex-col gap-8 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SentimentManager initial={sentiments} />
      <TagManager initial={tags} />
      <DataControls />
    </main>
  );
}
