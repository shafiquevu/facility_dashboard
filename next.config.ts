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
  // Links in reminders and emails carry this app's address, but these pages
  // are still served by hangar: signed document links, the approve/decline
  // page for a finding, and the public forms.
  async rewrites() {
    const hangar = process.env.FACILITY_MAINTENANCE_URL?.trim().replace(/\/$/, "");
    if (!hangar) return [];
    return [
      { source: "/doc", destination: `${hangar}/doc` },
      { source: "/r/:id", destination: `${hangar}/r/:id` },
      { source: "/forms/:path*", destination: `${hangar}/forms/:path*` },
      { source: "/coi", destination: `${hangar}/forms/coi` },
      { source: "/board", destination: `${hangar}/board.html` },
    ];
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
