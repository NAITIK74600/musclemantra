import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',      // static HTML export → deployable anywhere (Netlify, GitHub Pages, etc.)
  trailingSlash: true,   // /products/abc → /products/abc/index.html
  images: {
    unoptimized: true,   // required for static export (no server to optimize at runtime)
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
