import type { NextConfig } from "next";

const isGhPages = process.env.GH_PAGES === "true";
const repo = "waivy";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  trailingSlash: true,
  // Required for GitHub Pages project hosting (served at /<repo>/)
  basePath: isGhPages ? `/${repo}` : undefined,
  assetPrefix: isGhPages ? `/${repo}/` : undefined,
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
