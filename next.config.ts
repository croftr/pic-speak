import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Performance optimizations
  compiler: {
    // Keep console logs for debugging card creation issues
    // We can re-enable this optimization once the issue is resolved
    removeConsole: false,
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
