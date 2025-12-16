import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Enable static export
  output: "export",

  // Add base path for GitHub Pages deployment
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",

  // Configure asset prefix for GitHub Pages
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",

  // Ensure images are handled correctly
  images: {
    unoptimized: true,
  },

  // Disable API routes for static export
  experimental: {
    // This is needed for static export
  },

  // Add trailing slash for better GitHub Pages compatibility
  trailingSlash: true,
};

export default nextConfig;
