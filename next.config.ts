import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When opening dev server via LAN IP (e.g. phone), Next blocks dev assets by default.
  // Allow common local origins for development.
  allowedDevOrigins: ["localhost", "127.0.0.1", "172.20.10.6"],
};

export default nextConfig;
