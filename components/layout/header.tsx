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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header data-site-header className="sticky top-0 z-50 border-b border-white/[.06] bg-[#050505]/95 backdrop-blur-xl">
      <div className="page-shell grid min-h-[54px] md:min-h-[76px] grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 py-2 sm:py-2.5 md:flex md:gap-7 md:py-0">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-black tracking-wide" aria-label="Rakexura home">
          <Image src="/Assets/RakeLogo.png" width={36} height={36} alt="Rakexura" className="h-8 w-8 sm:h-10 sm:w-10 rounded-md object-contain" priority />
          <span className="hidden sm:block text-sm font-black tracking-wider">RAKEXURA</span>
        </Link>
        
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`text-sm transition-colors ${path === link.href ? "text-white" : "text-[#a0a8c0] hover:text-white"}`}>
              {link.label}
            </Link>
          ))}
        </nav>
        
        <div className="order-3 col-span-3 min-w-0 md:order-none md:ml-auto md:w-full md:max-w-[390px]">
          <PremiumSearch />
        </div>
        
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <HeaderNotificationButton />
          <button
            suppressHydrationWarning
            onClick={() => setCartOpen(true)}
            className="btn btn-secondary relative h-9 w-9 min-h-0 sm:h-11 sm:w-auto sm:min-h-11 p-0 sm:px-3 flex items-center justify-center"
            aria-label={`Open cart with ${mounted ? count : 0} items`}
          >
            <ShoppingBag size={17} />
            <span className="hidden sm:inline ml-1.5">Cart</span>
            {mounted && count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 sm:h-5 sm:min-w-5 items-center justify-center rounded-full bg-[#8b5cf6] px-1 text-[9px] sm:text-[11px] font-bold text-white ring-2 ring-[#050505]">
                {count}
              </span>
            )}
          </button>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
