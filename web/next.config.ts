import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // renamed tabs; old links keep working
  async redirects() {
    return [
      { source: "/forecast", destination: "/future-flops", permanent: true },
      { source: "/faq", destination: "/answers", permanent: true },
    ];
  },
};

export default nextConfig;
