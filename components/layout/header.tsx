"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { AccountMenu } from "@/components/account/account-menu";
import { PremiumSearch } from "@/components/store/premium-search";
import { HeaderNotificationButton } from "@/components/layout/header-notification-button";
import { useCartStore } from "@/stores/cart-store";

const links = [{ href: "/", label: "Discover" }, { href: "/games", label: "Browse" }, { href: "/bundles", label: "Bundles" }, { href: "/subscriptions", label: "Subscriptions" }, { href: "/support", label: "Support" }];

export function Header() {
  const path = usePathname();
  const count = useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0) + state.bundleLines.reduce((sum, line) => sum + line.quantity, 0));
  const setCartOpen = useCartStore((state) => state.setDrawerOpen);
  const [mounted, setMounted] = useState(false);

  const isAuthPage = Boolean(
    path === "/login" ||
    path === "/register" ||
    path === "/reset-password" ||
    path === "/otp-preview" ||
    path?.startsWith("/auth")
  );

  const isAdminPage = Boolean(path?.startsWith("/admin"));

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header data-site-header className="sticky top-0 z-50 border-b border-white/[.06] bg-[#050505]/92 backdrop-blur-xl">
      <div className={`page-shell ${isAuthPage || isAdminPage ? "flex items-center justify-between min-h-[64px] py-2.5" : "grid min-h-[76px] grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 py-3 md:flex md:gap-7 md:py-0"}`}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-3 font-black tracking-wide" aria-label="Rakexura home">
            <Image src="/Assets/RakeLogo.png" width={42} height={42} alt="Rakexura" className="rounded-md" priority />
            <span className="hidden sm:block">RAKEXURA</span>
          </Link>
          {isAdminPage && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8b5cf6]/50 bg-black/60 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] select-none">
              <span className="h-2 w-2 rounded-full bg-[#a78bfa] shadow-[0_0_8px_#8b5cf6] animate-pulse" />
              ADMIN
            </span>
          )}
        </div>

        {!isAuthPage && !isAdminPage && (
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${path === link.href ? "text-white" : "text-[#a0a8c0] hover:text-white"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {!isAuthPage && !isAdminPage && (
          <div className="order-3 col-span-3 min-w-0 md:order-none md:ml-auto md:w-full md:max-w-[390px]">
            <PremiumSearch />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!isAuthPage && !isAdminPage && <HeaderNotificationButton />}
          {!isAuthPage && !isAdminPage && (
            <button
              suppressHydrationWarning
              onClick={() => setCartOpen(true)}
              className="btn btn-secondary relative h-11 min-h-11 px-3"
              aria-label={`Open cart with ${mounted ? count : 0} items`}
            >
              <ShoppingBag size={19} />
              <span className="hidden sm:inline">Cart</span>
              {mounted && count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8b5cf6] px-1 text-[11px] text-white">
                  {count}
                </span>
              )}
            </button>
          )}
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
