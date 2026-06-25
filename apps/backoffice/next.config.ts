import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin'],
  transpilePackages: ['@livehub/shared'],
};

export default nextConfig;
