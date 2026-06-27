"use client";

import Link from "next/link";
import { Heart, Home, Library, ShoppingBag, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";

const items = [{ href: "/", label: "Home", icon: Home }, { href: "/games", label: "Browse", icon: Library }, { href: "/wishlist", label: "Saved", icon: Heart }, { href: "/cart", label: "Cart", icon: ShoppingBag }, { href: "/profile", label: "You", icon: UserRound }];

export function MobileNav() {
  const path = usePathname();
  const count = useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0) + state.bundleLines.reduce((sum, line) => sum + line.quantity, 0));
  return <nav className="fixed inset-x-0 bottom-0 z-50 grid h-[68px] grid-cols-5 border-t border-white/10 bg-[#08090c]/96 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">{items.map(({ href, label, icon: Icon }) => { const active = path === href; return <Link key={href} href={href} className={`relative flex flex-col items-center justify-center gap-1 text-[10px] transition ${active ? "text-[#c9bcff]" : "text-[#8d95aa]"}`}><Icon size={19} strokeWidth={active ? 2.5 : 1.8} />{label}{href === "/cart" && count > 0 && <span className="absolute right-[24%] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8b5cf6] px-1 text-[9px] text-white">{count}</span>}</Link>; })}</nav>;
}
