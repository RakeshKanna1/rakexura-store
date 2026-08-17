import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
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
import { WhatsAppFloat } from "@/components/common/whatsapp-float";
import { ComboDealsBanner } from "@/components/layout/combo-deals-banner";
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
    icon: "/Assets/RakeLogo.png",
    shortcut: "/Assets/RakeLogo.png",
    apple: "/Assets/RakeLogo.png",
  },
};

export const viewport: Viewport = { themeColor: "#05070f", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <head>
        <link rel="preconnect" href="https://cwvfgxdhearouclomjeq.supabase.co" />
        <link rel="dns-prefetch" href="https://cwvfgxdhearouclomjeq.supabase.co" />
      </head>
      <body className={geist.className} suppressHydrationWarning>
        <AppProviders>
          <ClickSpark sparkColor="#facc15" sparkSize={10} sparkRadius={24} sparkCount={10} duration={450} />
          <VisitorTracker />
          <FlyToCartAnimator />
          <MouseSpotlight />
          <CartDrawer />
          <Header />
          <ComboDealsBanner />
          <main><BackButton />{children}</main>
          <Footer />
          <WhatsAppOnboardingModal />
          <WhatsAppFloat />
          <MobileNav />
          <MobilePromptManager />
          <Toaster theme="dark" richColors position="top-center" />
        </AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
