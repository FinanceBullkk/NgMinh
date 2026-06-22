// Pure SWR cache-key matching (no React/Supabase deps) so the invalidation fan-out is
// unit-testable. Keys in use: "roster" · "feed-bootstrap" · "settings" · "profile:<id>".
// A pattern ending in ":*" matches any key with that prefix (e.g. "profile:*").
export function keyMatcher(...keys: string[]) {
  const exact = new Set(keys.filter((k) => !k.endsWith(":*")));
  const prefixes = keys.filter((k) => k.endsWith(":*")).map((k) => k.slice(0, -1));
  return (key: unknown): boolean =>
    typeof key === "string" &&
    (exact.has(key) || prefixes.some((p) => key.startsWith(p)));
}
