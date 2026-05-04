import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output is for Docker/self-hosted only and breaks Vercel's
  // dynamic-route serverless function generation. Leave output unset so
  // @vercel/next can correctly deploy each page as its own function.
};

export default nextConfig;
