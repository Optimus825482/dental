import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Turbopack yerine Webpack kullan — Docker build'de PostCSS uyumluluğu için
  bundlePagesRouterDependencies: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["dental.royalfnb.com"],
    },
  },
};

export default nextConfig;
