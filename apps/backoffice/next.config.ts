import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin'],
  turbopack: {
    root: '../../',
  },
};

export default nextConfig;
