import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin the workspace root to this project. A stray package-lock.json in the home
// directory otherwise makes Next infer the wrong root (build-time warning).
const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  distDir: process["env"]["PORT"] === "3100" ? "test-dist-e2e" : undefined,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
