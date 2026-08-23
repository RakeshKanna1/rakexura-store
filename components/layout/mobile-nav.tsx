"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Home, Library, ShoppingBag, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cart-store";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  color: string;
  gradient: string;
  glow: string;
  activeTextColor: string;
  iconColor?: string;
}

const items: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    color: "#8b5cf6",
    gradient: "from-[#8b5cf6] to-[#6d28d9]",
    glow: "rgba(139, 92, 246, 0.55)",
    activeTextColor: "text-[#c4b5fd]",
  },
  {
    href: "/games",
    label: "Browse",
    icon: Library,
    color: "#a855f7",
    gradient: "from-[#a855f7] to-[#7e22ce]",
    glow: "rgba(168, 85, 247, 0.55)",
    activeTextColor: "text-[#d8b4fe]",
  },
  {
    href: "/wishlist",
    label: "Saved",
    icon: Heart,
    color: "#f43f5e",
    gradient: "from-[#f43f5e] to-[#be123c]",
    glow: "rgba(244, 63, 94, 0.55)",
    activeTextColor: "text-[#fda4af]",
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingBag,
    color: "#facc15",
    gradient: "from-[#facc15] to-[#ca8a04]",
    glow: "rgba(250, 204, 21, 0.55)",
    activeTextColor: "text-[#fef08a]",
    iconColor: "text-black",
  },
  {
    href: "/profile",
    label: "You",
    icon: UserRound,
    color: "#6366f1",
    gradient: "from-[#6366f1] to-[#4338ca]",
    glow: "rgba(99, 102, 241, 0.55)",
    activeTextColor: "text-[#c7d2fe]",
  },
];

function getActiveIndex(path: string | null): number {
  if (!path || path === "/" || path.startsWith("/bundles") || path.startsWith("/subscriptions")) return 0;
  if (path.startsWith("/games")) return 1;
  if (path.startsWith("/wishlist")) return 2;
  if (path.startsWith("/cart") || path.startsWith("/checkout")) return 3;
  if (path.startsWith("/profile") || path.startsWith("/dashboard") || path.startsWith("/settings")) return 4;
  return 0;
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

  const activeIndex = getActiveIndex(path);
  const activeItem = items[activeIndex] ?? items[0];
  const ActiveIcon = activeItem.icon;

  useEffect(() => {
    setMounted(true);
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  if (isAuthPage) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 md:hidden select-none"
      aria-label="Magic Mobile Navigation"
    >
      {/* Background Shell Container */}
      <div className="relative h-[calc(62px+env(safe-area-inset-bottom,0px))] border-t border-white/[0.08] bg-[#07080c]/95 px-1 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-2xl shadow-[0_-10px_32px_rgba(0,0,0,0.85)]">
        
        {/* Magic Sliding Elevated Notch & Glowing Orb */}
        <motion.div
          className="pointer-events-none absolute top-0 flex items-center justify-center"
          style={{ width: "20%" }}
          animate={{ left: `${activeIndex * 20}%` }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Sculpted Curved Notch Socket */}
          <div className="relative -top-[22px] flex items-center justify-center">
            {/* Left Inverse Liquid Curve */}
            <div className="absolute -left-[14px] top-[22px] h-3.5 w-3.5 rounded-tr-xl bg-transparent shadow-[4px_-4px_0_0_#07080c]" />

            {/* Sunken Socket Circle */}
            <div className="relative flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#07080c] border-[3px] border-[#07080c] shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              {/* Floating Elevated Neon Pill / Orb */}
              <motion.div
                key={activeItem.href}
                initial={{ scale: 0.7, y: 6 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.7, y: 6 }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${activeItem.gradient} shadow-lg relative`}
                style={{
                  boxShadow: `0 0 24px ${activeItem.glow}, 0 4px 12px rgba(0,0,0,0.6)`,
                }}
              >
                <ActiveIcon size={20} strokeWidth={2.4} className={activeItem.iconColor ?? "text-white"} />

                {/* Floating Cart Counter on Active Orb */}
                {activeItem.href === "/cart" && mounted && count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-md ring-2 ring-[#07080c]">
                    {count}
                  </span>
                )}
              </motion.div>
            </div>

            {/* Right Inverse Liquid Curve */}
            <div className="absolute -right-[14px] top-[22px] h-3.5 w-3.5 rounded-tl-xl bg-transparent shadow-[-4px_-4px_0_0_#07080c]" />
          </div>
        </motion.div>

        {/* Navigation Tab Links Grid */}
        <div className="relative flex h-[62px] w-full items-center justify-between">
          {items.map(({ href, label, icon: Icon, activeTextColor }, index) => {
            const isActive = activeIndex === index;

            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => {
                  if (isActive) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="relative z-10 flex h-full flex-1 flex-col items-center justify-center pt-2 focus:outline-none"
              >
                {/* Resting Icon (Fades out smoothly when tab becomes active as orb takes over) */}
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <motion.div
                    animate={{
                      opacity: isActive ? 0 : 1,
                      y: isActive ? -16 : 0,
                      scale: isActive ? 0.5 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.9}
                      className="text-[#7e879c] transition-colors hover:text-white"
                    />
                  </motion.div>

                  {/* Cart Counter on Inactive Tab */}
                  {!isActive && href === "/cart" && mounted && count > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#facc15] px-1 text-[9px] font-black text-black shadow-[0_0_10px_rgba(250,204,21,0.6)]">
                      {count}
                    </span>
                  )}
                </div>

                {/* Animated Text Label */}
                <motion.span
                  className={`text-[10px] font-bold tracking-tight transition-colors duration-200 mt-1 ${
                    isActive ? activeTextColor : "text-[#767e90]"
                  }`}
                  animate={{
                    y: isActive ? 3 : 0,
                    scale: isActive ? 1.05 : 0.95,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  {label}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
