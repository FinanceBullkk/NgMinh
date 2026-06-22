import { FeedView } from "@/components/feed/feed-view";

// Feed (by-time): rendered client-side. The browser fetches directly from Supabase (RLS),
// so navigation doesn't pay an SSR round-trip through the serverless function. See feed-view.
export default function FeedPage() {
  return <FeedView />;
}
