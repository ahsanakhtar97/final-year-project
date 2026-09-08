import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output is for Docker/self-hosted only and breaks Vercel's
  // dynamic-route serverless function generation. Leave output unset so
  // @vercel/next can correctly deploy each page as its own function.

  // A stray package-lock.json sits in the repo root, so Next would otherwise
  // infer the root as the workspace and warn on every build. The app really
  // is rooted here.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
