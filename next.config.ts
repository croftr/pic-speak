import type { NextConfig } from "next";

// Content Security Policy — controls which resources the browser is allowed to load
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' https://*.clerk.com https://*.clerk.accounts.dev 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.public.blob.vercel-storage.com data: blob:",
  "media-src 'self' https://*.public.blob.vercel-storage.com blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://vitals.vercel-insights.com https://*.public.blob.vercel-storage.com",
  "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

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
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
