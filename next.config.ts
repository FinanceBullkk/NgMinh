import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin the workspace root to this project. A stray package-lock.json in the home
// directory otherwise makes Next infer the wrong root (build-time warning).
const projectRoot = dirname(fileURLToPath(import.meta.url));

const isProd = process.env.NODE_ENV === "production";

// Static security headers (audit M1) applied to ALL responses incl. assets. The nonce-based CSP
// is set per-request in middleware (it cannot carry a nonce here). HSTS only in production.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Isolate the e2e build output so it never clobbers the dev `.next`. Gated on a
  // dedicated var (NOT PORT — hosts inject PORT and would mis-route the build dir).
  distDir: process.env.E2E_BUILD === "1" ? "test-dist-e2e" : undefined,
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
