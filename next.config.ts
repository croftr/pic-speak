import type { NextConfig } from "next";

// Content Security Policy — controls which resources the browser is allowed to load
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' https://clerk.myvoiceboard.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.public.blob.vercel-storage.com data: blob:",
  "media-src 'self' https://*.public.blob.vercel-storage.com blob:",
  "font-src 'self'",
  "connect-src 'self' https://clerk.myvoiceboard.com https://*.clerk.com https://*.clerk.accounts.dev https://vitals.vercel-insights.com https://*.vercel-insights.com https://*.public.blob.vercel-storage.com",
  "frame-src 'self' https://clerk.myvoiceboard.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
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

  // Pin the workspace root to this project directory. Without this, Turbopack
  // infers the root by walking up for a lockfile, which can land outside the
  // project and break module resolution (e.g. "Can't resolve 'tailwindcss'").
  turbopack: {
    root: process.cwd(),
  },

  // Performance optimizations
  compiler: {
    // Strip console.* in production builds, but keep console.error/warn so
    // real problems are still visible. Dev keeps all logs for debugging.
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  allowedDevOrigins: ['127.0.0.1'],

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
