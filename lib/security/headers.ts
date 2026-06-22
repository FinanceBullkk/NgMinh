// Browser security headers (audit M1). A nonce-based strict CSP was evaluated but rejected: Next's
// statically-prerendered pages cannot carry a per-request nonce, so every chunk + inline bootstrap
// script would be blocked (no hydration). Instead we ship a CSP that works with Next's static+
// dynamic output and still locks down the high-value vectors. The residual is `script-src
// 'unsafe-inline'`; the app renders no user-controlled HTML (no dangerouslySetInnerHTML), so the
// script-injection surface is low. A true nonce CSP would require forcing dynamic rendering app-wide
// (tracked as follow-up). Styles keep 'unsafe-inline' (Tailwind v4 injects inline <style>).

// Build the Content-Security-Policy. `connect-src` must include the Supabase origin because the
// browser talks DIRECTLY to Supabase (REST + auth + realtime websockets).
export function buildCsp(supabaseUrl: string, isDev: boolean): string {
  const wss = supabaseUrl.replace(/^http/, "ws");
  // Dev also needs eval (React refresh) + ws (HMR).
  const scriptExtra = isDev ? " 'unsafe-eval'" : "";
  const connectExtra = isDev ? " ws: wss:" : "";
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${scriptExtra}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self' ${supabaseUrl} ${wss}${connectExtra}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
  ].join("; ");
}

// The non-CSP security headers (also mirrored statically in next.config for asset responses).
export function staticSecurityHeaders(isProd: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    // NOT 'no-referrer': that makes browsers send `Origin: null` on POSTs, which trips Next's
    // Server Action CSRF origin check (Invalid Server Actions request). This still sends only the
    // origin cross-origin and nothing on downgrade.
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  };
  // HSTS only over HTTPS (production). Browsers ignore it on plain HTTP.
  if (isProd) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }
  return headers;
}
