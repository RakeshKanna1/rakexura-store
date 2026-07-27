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
import { FlyToCartAnimator } from "@/components/common/fly-to-cart-animator";
import { Sparkles } from "lucide-react";
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
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <body className={geist.className}>
        <ClickSpark sparkColor="#facc15" sparkSize={10} sparkRadius={24} sparkCount={10} duration={450}>
          <AppProviders>
            <VisitorTracker />
            <FlyToCartAnimator />
            <MouseSpotlight />
            <CartDrawer />
            <Header />
            <div className="border-b border-white/[0.08] bg-[#07090e] py-2 text-center text-xs select-none">
              <div className="flex flex-wrap items-center justify-center gap-2 px-4">
                <span className="font-black text-[#facc15] text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="text-[#facc15] shrink-0" /> COMBO DEALS
                </span>
                <span className="text-[#8991a6] font-normal">•</span>
                <span className="text-[#c3c9d8] font-medium">Save big on curated game collections!</span>
                <Link 
                  href="/bundles" 
                  className="font-bold text-[#facc15] hover:underline transition-all ml-1 inline-flex items-center gap-1 group/link"
                >
                  <span>View Bundles</span>
                  <span className="inline-block transition-transform duration-150 group-hover/link:translate-x-0.5">&rarr;</span>
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

