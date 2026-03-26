import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Coolify reverse proxy için
  experimental: {
    serverActions: {
      allowedOrigins: ["dental.royalfnb.com"],
    },
  },
};

export default nextConfig;
