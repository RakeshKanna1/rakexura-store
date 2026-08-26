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
      <div
        className={`mx-auto w-full max-w-[1580px] px-3 sm:px-5 lg:px-5 ${
          isAuthPage || isAdminPage
            ? "flex items-center justify-between min-h-[60px] sm:min-h-[64px] py-2.5"
            : "grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2.5 py-2.5 md:flex md:items-center md:gap-6 lg:gap-8 md:py-0 md:min-h-[74px]"
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3 font-black tracking-wide" aria-label="Rakexura home">
            <Image src="/Assets/RakeLogo.png" width={38} height={38} alt="Rakexura" className="rounded-md sm:w-[42px] sm:h-[42px]" priority />
            <span className="block text-sm sm:text-base tracking-wider">RAKEXURA</span>
          </Link>
        </div>

        {!isAuthPage && !isAdminPage && (
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${path === link.href ? "text-white font-semibold" : "text-[#a0a8c0] hover:text-white"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {!isAuthPage && !isAdminPage && (
          <div className="order-3 col-span-3 min-w-0 md:order-none md:ml-auto md:w-full md:max-w-[340px] lg:max-w-[380px]">
            <PremiumSearch />
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-self-end">
          {!isAuthPage && !isAdminPage && <HeaderNotificationButton />}
          {!isAuthPage && !isAdminPage && (
            <button
              suppressHydrationWarning
              onClick={() => setCartOpen(true)}
              className="btn btn-secondary relative h-10 sm:h-11 min-h-10 sm:min-h-11 px-2.5 sm:px-3 flex items-center justify-center gap-1.5"
              aria-label={`Open cart with ${mounted ? count : 0} items`}
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline text-xs sm:text-sm">Cart</span>
              {mounted && count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8b5cf6] px-1 text-[11px] font-bold text-white shadow-sm">
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
