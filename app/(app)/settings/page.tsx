import { SettingsView } from "@/components/settings/settings-view";

// Settings (by-config): rendered client-side. The browser fetches directly from Supabase (RLS),
// so navigation doesn't pay an SSR round-trip through the serverless function. See settings-view.
export default function SettingsPage() {
  return <SettingsView />;
}
