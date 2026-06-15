import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:30000";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@openworks/backend"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
