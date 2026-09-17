import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  images: {
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.us-west-2.amazonaws.com",
        pathname: "/secure.notion-static.com/**",
      },
      { protocol: "https", hostname: "secure.notion-static.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
