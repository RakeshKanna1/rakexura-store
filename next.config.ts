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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
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
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js", "@sentry/nextjs", "@sentry/node", "@opentelemetry/api"],
  async headers() {
    return [
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico|Assets).*)",
        headers: [
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
            key: "X-Frame-Options",
            value: "DENY",
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
  widenClientFileUpload: true,
});
