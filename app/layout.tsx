import type { Metadata, Viewport } from "next";
import { preconnect } from "react-dom";
import { Toaster } from "sonner";
import Link from "next/link";
import { Geist } from "next/font/google";
import { AppProviders } from "@/components/common/app-providers";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BackButton } from "@/components/layout/back-button";
import { MouseSpotlight } from "@/components/animations/mouse-spotlight";
import { ClickSpark } from "@/components/animations/click-spark";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WhatsAppOnboardingModal } from "@/components/layout/whatsapp-onboarding-modal";
import { MobilePromptManager } from "@/components/layout/mobile-prompt-manager";
import { VisitorTracker } from "@/components/common/visitor-tracker";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rakeon-store.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Rakexura Store", template: "%s | Rakexura" },
  description: "Premium PC games, bundles, instant support and order tracking from Rakexura.",
  openGraph: { title: "Rakexura Store", description: "Your next game, for less.", url: siteUrl, siteName: "Rakexura", type: "website" },
  robots: { index: true, follow: true },
  icons: {
    icon: "/Assets/RakeBadge.png",
    shortcut: "/Assets/RakeBadge.png",
    apple: "/Assets/RakeBadge.png",
  },
};

export const viewport: Viewport = { themeColor: "#05070f", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cwvfgxdhearouclomjeq.supabase.co";
  preconnect(supabaseUrl);

  return (
    <html lang="en" suppressHydrationWarning className={geist.variable} data-scroll-behavior="smooth">
      <body className={geist.className}>
        <ClickSpark sparkColor="#facc15" sparkSize={10} sparkRadius={24} sparkCount={10} duration={450}>
          <AppProviders>
            <VisitorTracker />
            <MouseSpotlight />
            <CartDrawer />
            <Header />
            <div className="relative overflow-hidden border-b border-white/[0.06] bg-[#05070f] py-2 text-center text-[11px] font-semibold tracking-wider text-[#d1d5db]">
              {/* Soft black overlay */}
              <div className="absolute inset-0 bg-black/45" />
              
              {/* Subtle premium gold radial glow background */}
              <div className="absolute -inset-x-10 top-0 bottom-0 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.06),transparent_70%)] pointer-events-none" />

              {/* Content container */}
              <div className="relative z-10 flex items-center justify-center gap-1.5 px-4">
                <span>🔥</span>
                <strong className="text-[#facc15] font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.25)]">
                  COMBO DEALS:
                </strong>
                <span className="text-white/80">Save big on curated game collections!</span>
                <Link href="/bundles" className="ml-1 text-[#facc15] underline hover:text-[#fbbf24] transition-colors font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.15)]">
                  View Bundles &rarr;
                </Link>
              </div>
            </div>
            <main><BackButton />{children}</main>
            <Footer />
            <WhatsAppOnboardingModal />
            <MobileNav />
            <MobilePromptManager />
            <Toaster theme="dark" richColors position="top-center" />
          </AppProviders>
        </ClickSpark>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

