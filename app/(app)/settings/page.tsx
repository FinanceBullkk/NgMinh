import { listAllSentimentOptions } from "@/lib/data/sentiment";
import { SentimentManager } from "@/components/settings/sentiment-manager";

// Settings. Phase 7 adds the sentiment manager; Phase 8 extends with tags + export/delete.
export default async function SettingsPage() {
  const sentiments = await listAllSentimentOptions();
  return (
    <main className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SentimentManager initial={sentiments} />
    </main>
  );
}
