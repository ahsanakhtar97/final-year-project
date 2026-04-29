import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles only the dependencies the app actually uses,
  // letting the Docker runtime image stay small. Local `npm run dev` is
  // unaffected by this setting.
  output: "standalone",
};

export default nextConfig;
