import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname; }
  catch { return ""; }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname ? [{ protocol: "https", hostname: supabaseHostname }] : [],
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
};

export default nextConfig;
