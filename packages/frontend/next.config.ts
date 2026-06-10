import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@openworks/backend"],
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:30000/api/auth/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:30000/:path*",
      },
    ];
  },
};

export default nextConfig;
