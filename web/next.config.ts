import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Vercel Services owns public API routing in the hosted deployment.
    if (process.env.VERCEL && !process.env.API_PROXY_URL) return [];
    const backend = (
      process.env.API_PROXY_URL || "http://127.0.0.1:8080"
    ).replace(/\/+$/, "");
    return [
      { source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
