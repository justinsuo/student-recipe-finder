import type { NextConfig } from "next";

const isGhPages = process.env.GH_PAGES === "true";
const repo = "student-recipe-finder";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Required for GitHub Pages project hosting (served at /<repo>/)
  basePath: isGhPages ? `/${repo}` : undefined,
  assetPrefix: isGhPages ? `/${repo}/` : undefined,
};

export default nextConfig;
