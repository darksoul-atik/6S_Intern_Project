import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  async redirects() {
    return [
      {
        source: "/profile/me",
        destination: "/profile",
        permanent: false,
      },
      {
        source: "/profile/me/edit",
        destination: "/profile/edit",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
