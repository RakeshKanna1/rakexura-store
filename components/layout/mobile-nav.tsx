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
  glowColor: string;
  activeTextColor: string;
  badgeBg?: string;
}

const items: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    color: "#a78bfa",
    glowColor: "rgba(167, 139, 250, 0.8)",
    activeTextColor: "text-[#ddd6fe]",
  },
  {
    href: "/games",
    label: "Browse",
    icon: Library,
    color: "#c084fc",
    glowColor: "rgba(192, 132, 252, 0.8)",
    activeTextColor: "text-[#e9d5ff]",
  },
  {
    href: "/wishlist",
    label: "Saved",
    icon: Heart,
    color: "#fb7185",
    glowColor: "rgba(251, 113, 133, 0.8)",
    activeTextColor: "text-[#fecdd3]",
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingBag,
    color: "#facc15",
    glowColor: "rgba(250, 204, 21, 0.85)",
    activeTextColor: "text-[#fef08a]",
    badgeBg: "bg-[#facc15]",
  },
  {
    href: "/profile",
    label: "You",
    icon: UserRound,
    color: "#818cf8",
    glowColor: "rgba(129, 140, 248, 0.8)",
    activeTextColor: "text-[#e0e7ff]",
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

  useEffect(() => {
    setMounted(true);
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  if (isAuthPage) return null;

  return (
    <nav
      className="fixed bottom-2.5 inset-x-2.5 sm:inset-x-6 max-w-[430px] mx-auto z-50 md:hidden select-none"
      aria-label="Mobile navigation bar"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Floating Cyber Glass Capsule Shell */}
      <div className="relative flex h-[62px] w-full items-center justify-around rounded-2xl border border-white/[0.13] bg-[#070911]/92 p-1.5 backdrop-blur-2xl shadow-[0_16px_45px_rgba(0,0,0,0.92),0_0_30px_rgba(139,92,246,0.12),inset_0_1px_1px_rgba(255,255,255,0.14)]">
        
        {items.map(({ href, label, icon: Icon, color, glowColor, activeTextColor }, index) => {
          const isActive = activeIndex === index;

          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              onPointerDown={() => router.prefetch(href)}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="relative flex h-full flex-1 flex-col items-center justify-center rounded-xl transition-all duration-200 focus:outline-none"
            >
              {/* Active Magnetic Glowing Backdrop Capsule */}
              {isActive && (
                <motion.div
                  layoutId="active-dock-indicator"
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.12] to-white/[0.03] border border-white/[0.16] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_16px_rgba(0,0,0,0.5)]"
                  transition={{
                    type: "spring",
                    stiffness: 480,
                    damping: 34,
                    mass: 0.7,
                  }}
                />
              )}

              {/* Icon with Spring Bounce & Neon Bloom */}
              <div className="relative z-10 flex h-6 w-6 items-center justify-center">
                <motion.div
                  animate={{
                    scale: isActive ? 1.14 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 26,
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    style={
                      isActive
                        ? {
                            color,
                            filter: `drop-shadow(0 0 8px ${glowColor})`,
                          }
                        : undefined
                    }
                    className={`transition-colors duration-200 ${
                      isActive ? "" : "text-[#7b849c] hover:text-white"
                    }`}
                  />
                </motion.div>

                {/* Cart Notification Badge */}
                {href === "/cart" && mounted && count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#facc15] px-1 text-[9.5px] font-black text-black shadow-[0_0_10px_rgba(250,204,21,0.85)] ring-2 ring-[#070911]"
                  >
                    {count}
                  </motion.span>
                )}
              </div>

              {/* Text Label with Active Neon Accent */}
              <span
                className={`relative z-10 text-[10px] font-bold tracking-tight transition-all duration-200 mt-0.5 ${
                  isActive ? `${activeTextColor} font-black` : "text-[#6c758d]"
                }`}
              >
                {label}
              </span>

              {/* Micro Active Glow Pip Indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-dock-pip"
                  className="absolute bottom-1 h-1 w-3 rounded-full shadow-sm"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${glowColor}`,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
