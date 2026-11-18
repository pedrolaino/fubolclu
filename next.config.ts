import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Same as the built-in default, except a page nobody opened for an hour is rebuilt
    // before it's served instead of showing the old data once.
    default: { stale: 300, revalidate: 900, expire: 3600 },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
