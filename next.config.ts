import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/groundstationdevices",
        destination: "/groundstationkit",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
