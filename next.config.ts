import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin the workspace root to this project. A stray package-lock.json in the home
// directory otherwise makes Next infer the wrong root (build-time warning).
const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Isolate the e2e build output so it never clobbers the dev `.next`. Gated on a
  // dedicated var (NOT PORT — hosts inject PORT and would mis-route the build dir).
  distDir: process.env.E2E_BUILD === "1" ? "test-dist-e2e" : undefined,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
