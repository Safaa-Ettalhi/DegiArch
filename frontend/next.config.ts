import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  typedRoutes: false,
  output: 'standalone',
};

export default nextConfig;
