"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Home, Library, ShoppingBag, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/games", label: "Browse", icon: Library },
  { href: "/wishlist", label: "Saved", icon: Heart },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/profile", label: "You", icon: UserRound },
];

function isTabActive(path: string | null, href: string): boolean {
  if (!path) return href === "/";
  if (href === "/") return path === "/" || path.startsWith("/bundles") || path.startsWith("/subscriptions");
  if (href === "/games") return path.startsWith("/games");
  if (href === "/wishlist") return path.startsWith("/wishlist");
  if (href === "/cart") return path.startsWith("/cart") || path.startsWith("/checkout");
  if (href === "/profile") return path.startsWith("/profile") || path.startsWith("/dashboard") || path.startsWith("/settings");
  return path === href;
}

export function MobileNav() {
  const path = usePathname();
  const router = useRouter();
  const count = useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0) + state.bundleLines.reduce((sum, line) => sum + line.quantity, 0));
  const [mounted, setMounted] = useState(false);

  const isAuthPage = Boolean(
    path === "/login" ||
    path === "/register" ||
    path === "/reset-password" ||
    path === "/otp-preview" ||
    path?.startsWith("/auth") ||
    path?.startsWith("/admin")
  );

  useEffect(() => {
    setMounted(true);
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  if (isAuthPage) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(60px+env(safe-area-inset-bottom,0px))] items-center justify-around border-t border-white/10 bg-[#08090c]/96 px-1 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl md:hidden select-none"
      aria-label="Mobile navigation"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isTabActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            onPointerDown={() => router.prefetch(href)}
            onClick={(e) => {
              if (active) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`group relative flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-semibold transition-all duration-150 active:scale-90 ${
              active ? "text-[#c9bcff]" : "text-[#8d95aa] hover:text-white"
            }`}
          >
            <div className="relative">
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 1.8}
                className={`shrink-0 mb-0.5 transition-colors ${
                  active ? "text-[#c9bcff] drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" : "text-[#8d95aa]"
                }`}
              />

              {/* Live Cart Counter Badge */}
              {href === "/cart" && mounted && count > 0 && (
                <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8b5cf6] px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#08090c]">
                  {count}
                </span>
              )}
            </div>

            <span className={`tracking-tight ${active ? "font-extrabold text-white" : ""}`}>
              {label}
            </span>

            {/* Subtle active glow indicator pill */}
            {active && (
              <span className="absolute bottom-0.5 h-0.5 w-4 rounded-full bg-[#8b5cf6] shadow-[0_0_6px_#8b5cf6]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
