"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Home, Library, ShoppingBag, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";

const items = [{ href: "/", label: "Home", icon: Home }, { href: "/games", label: "Browse", icon: Library }, { href: "/wishlist", label: "Saved", icon: Heart }, { href: "/cart", label: "Cart", icon: ShoppingBag }, { href: "/profile", label: "You", icon: UserRound }];

export function MobileNav() {
  const path = usePathname();
  const router = useRouter();
  const count = useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0) + state.bundleLines.reduce((sum, line) => sum + line.quantity, 0));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prefetch bottom nav items in background on mobile mounts
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(60px+env(safe-area-inset-bottom,0px))] items-center justify-around border-t border-white/10 bg-[#08090c]/96 px-1 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl md:hidden select-none"
      aria-label="Mobile navigation"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={(e) => {
              if (active) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`relative flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-semibold transition-colors ${
              active ? "text-[#c9bcff]" : "text-[#8d95aa] hover:text-white"
            }`}
          >
            <Icon size={19} strokeWidth={active ? 2.5 : 1.8} className="shrink-0 mb-0.5" />
            <span>{label}</span>
            {href === "/cart" && mounted && count > 0 && (
              <span className="absolute right-[20%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8b5cf6] px-1 text-[9px] font-bold text-white shadow-sm">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
