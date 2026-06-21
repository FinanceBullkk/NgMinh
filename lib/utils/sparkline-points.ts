import type { Entry, SentimentOption } from "@/lib/types/models";

type SentimentPoint = Pick<Entry, "sentiment_id" | "entry_date" | "created_at">;
type SentimentColor = Pick<SentimentOption, "id" | "color">;

// Produce oldest-to-newest colors. Archived options remain resolvable because
// historical evidence must retain its original color.
export function buildSentimentColorSeries(
  entries: SentimentPoint[],
  sentiments: SentimentColor[],
  limit = 20,
): string[] {
  if (limit <= 0) return [];
  const colorById = new Map(sentiments.map((sentiment) => [sentiment.id, sentiment.color]));

  return [...entries]
    .sort(
      (a, b) =>
        a.entry_date.localeCompare(b.entry_date) ||
        a.created_at.localeCompare(b.created_at),
    )
    .flatMap((entry) => {
      if (!entry.sentiment_id) return [];
      const color = colorById.get(entry.sentiment_id);
      return color ? [color] : [];
    })
    .slice(-limit);
}
