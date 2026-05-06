import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // Required for Docker single-container deployment
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
