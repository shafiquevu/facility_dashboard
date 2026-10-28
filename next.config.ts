import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Inspection reports are uploaded through server actions; the default 1 MB
    // would refuse most PDFs. Vercel itself caps a request at about 4.5 MB.
    serverActions: { bodySizeLimit: "5mb" },
    proxyClientMaxBodySize: "5mb",
  },
  cacheComponents: true,
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
