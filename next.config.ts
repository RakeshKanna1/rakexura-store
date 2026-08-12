import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const supabaseHostname = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cwvfgxdhearouclomjeq.supabase.co";
    return new URL(url).hostname;
  }
  catch {
    return "cwvfgxdhearouclomjeq.supabase.co";
  }
})();

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co https://*.supabase.in https://images.unsplash.com https://wa.me https://img.youtube.com https://*.ytimg.com https://*.youtube.com;
  media-src 'self' blob: data: https://*.supabase.co https://*.supabase.in;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.wa.me https://*.upstash.io https://*.upstash.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://vitals.vercel-insights.com https://vitals.vercel-analytics.com;
  frame-src 'self' https://*.discord.com https://*.google.com https://www.youtube.com https://www.youtube-nocookie.com;
  frame-ancestors 'none';
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  crossOrigin: "anonymous",
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "date-fns",
      "sonner",
      "clsx",
      "tailwind-merge",
      "swiper",
      "zustand",
      "@tanstack/react-query",
    ],
  },
  images: {
    minimumCacheTTL: 2592000, // 30 days image caching
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname || "cwvfgxdhearouclomjeq.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.unsplash.com",
      }
    ],
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      {
        source: "/(images|fonts|_next/static)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/Assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "rakexura",
  project: "rakexura-store",
});
