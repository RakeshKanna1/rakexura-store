"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  ChevronDown, 
  BarChart3, 
  BellRing, 
  Boxes, 
  ImageIcon, 
  LayoutDashboard, 
  LifeBuoy, 
  Megaphone, 
  MessageSquareText, 
  PackageCheck, 
  Send, 
  TicketPercent, 
  Trophy, 
  Users,
  Layers
} from "lucide-react";

const navigation = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/orders", "Orders", PackageCheck],
  ["/admin/games", "Games", Boxes],
  ["/admin/bundles", "Combos", Layers],
  ["/admin/storefront", "Storefront", Megaphone],
  ["/admin/messages", "Messages", BellRing],
  ["/admin/rewards", "Ranks", Trophy],
  ["/admin/customers", "Customers", Users],
  ["/admin/coupons", "Coupons", TicketPercent],
  ["/admin/reviews", "Reviews", MessageSquareText],
  ["/admin/requests", "Vouchers", Trophy],
  ["/admin/game-requests", "Requests", Send],
  ["/admin/support", "Support", LifeBuoy],
  ["/admin/media", "Media", ImageIcon],
  ["/admin/analytics", "Analytics", BarChart3]
] as const;

export function AdminNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Find active nav item based on route prefix matching to keep correct active state on subpages
  const currentNav = navigation.find(([href]) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }) || navigation[0];
  
  const CurrentIcon = currentNav[2];

  return (
    <div className="premium-panel rounded-lg p-3 bg-[#0d0b1a]/85 border-[#8b5cf6]/20">
      {/* Desktop Sidebar Header */}
      <div className="hidden border-b border-white/[.07] px-3 pb-4 pt-2 lg:block">
        <p className="eyebrow">Rakexura</p>
        <strong className="mt-2 block text-white font-bold">Admin operations</strong>
      </div>

      {/* Mobile Accordion Trigger Bar */}
      <div className="lg:hidden flex items-center justify-between border-b border-white/[.07] pb-3 mb-2 px-1">
        <div className="flex items-center gap-2">
          <CurrentIcon size={16} className="text-[#b9a4ff]" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {currentNav[1]}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#b9a4ff] hover:text-white px-2.5 py-1.5 rounded bg-white/[.03] border border-white/5 active:scale-95 transition"
        >
          {isOpen ? <X size={14} /> : <Menu size={14} />}
          <span>{isOpen ? "Close" : "Sections Menu"}</span>
          <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Responsive Navigation List */}
      <nav
        className={`${
          isOpen ? "grid grid-cols-2 sm:grid-cols-3 gap-2 py-2" : "hidden"
        } lg:mt-2 lg:block lg:space-y-1`}
        aria-label="Admin navigation"
      >
        {navigation.map(([href, label, Icon]) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition active:scale-[0.98] border ${
                isActive
                  ? "bg-[#8b5cf6]/20 text-[#b9a4ff] border-[#8b5cf6]/35 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                  : "text-[#9ea6b9] border-transparent hover:bg-[#8b5cf6]/10 hover:text-[#b9a4ff] hover:border-[#8b5cf6]/20"
              }`}
            >
              <Icon size={16} className={isActive ? "text-[#b9a4ff]" : "text-[#9ea6b9]"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
