import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  allowedDevOrigins: ["172.16.54.18", '175.192.236.31'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
