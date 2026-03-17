import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  // Tell Next.js the monorepo root so standalone mirrors the full path tree.
  // Without this, server.js ends up at apps/web/server.js inside standalone.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@absurd/db", "@absurd/types"],
  serverExternalPackages: ["postgres"],
};

export default withPWA(nextConfig);
