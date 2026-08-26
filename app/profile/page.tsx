import Image from "next/image";
import Link from "next/link";
import { Bell, Gamepad2, Heart, LifeBuoy, PackageSearch, Settings, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/account/logout-button";
import { createClient } from "@/lib/supabase/server";
import { OWNER_EMAIL } from "@/lib/config";
import { BackButton } from "@/components/layout/back-button";
const shortcuts = [
  ["/dashboard", "Dashboard", UserRound], ["/dashboard/orders", "My orders", PackageSearch],
  ["/dashboard/library", "My games", Gamepad2], ["/wishlist", "Wishlist", Heart],
  ["/cart", "Cart", ShoppingBag], ["/dashboard/notifications", "Notifications", Bell],
  ["/support", "Support", LifeBuoy],
] as const;

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?message=Sign in to open your account.");
  const { data: profile } = await supabase.from("profiles").select("display_name,whatsapp,role,avatar_url").eq("id", user.id).maybeSingle();
  const name = profile?.display_name || user.user_metadata.full_name || user.email?.split("@")[0] || "Player";
  const owner = user.email?.toLowerCase() === OWNER_EMAIL;

  return (
    <div className="page-shell py-6 sm:py-10">
      <BackButton href="/" label="Back to Store" className="mb-3 sm:mb-4" />
      
      {/* Profile Header Card */}
      <header className="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5 rounded-xl border border-white/[.08] bg-[#0c0f16] shadow-lg">
        <span className="relative grid h-12 w-12 sm:h-14 sm:w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#8b5cf6]/30 to-[#8b5cf6]/10 text-lg sm:text-xl font-black text-[#d4caff] border border-[#8b5cf6]/30 shadow-[0_0_12px_rgba(139,92,246,0.25)]">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt={`${name} profile picture`} fill sizes="56px" className="object-cover" unoptimized />
          ) : (
            name.slice(0, 1).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[.16em] text-[#facc15]">Your account</p>
          <h1 className="mt-0.5 sm:mt-1 truncate text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight">{name}</h1>
          <p className="mt-0.5 truncate text-xs sm:text-sm text-[#8991a6] font-medium">{user.email}</p>
        </div>
      </header>

      {/* Admin Quick Action */}
      {(profile?.role === "admin" || owner) && (
        <Link
          href="/admin"
          className="mt-3 sm:mt-5 flex min-h-11 sm:min-h-14 items-center gap-2.5 sm:gap-3 rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/[.08] px-4 sm:px-5 text-xs sm:text-sm font-black uppercase tracking-wider text-[#d4caff] hover:bg-[#8b5cf6]/[.14] transition-colors"
        >
          <ShieldCheck size={18} className="text-[#a78bfa] shrink-0" />
          <span>{profile?.role === "admin" ? "Open admin dashboard" : "Activate admin access"}</span>
        </Link>
      )}

      {/* Shortcuts Grid */}
      <section className="mt-5 sm:mt-8">
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white mb-2.5 sm:mb-3">Quick access</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {shortcuts.map(([href, label, Icon]) => (
            <Link
              href={href}
              key={href}
              className="flex min-h-[76px] sm:min-h-24 flex-col justify-between rounded-xl border border-white/[.07] bg-[#0c0f16] p-3 sm:p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#121622] active:scale-[0.97]"
            >
              <Icon size={18} className="text-[#b9a4ff]" />
              <span className="text-xs sm:text-sm font-bold text-white">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Settings & Logout */}
      <section className="mt-5 sm:mt-8 grid gap-2.5 sm:gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/settings"
          className="flex min-h-11 sm:min-h-14 items-center gap-2.5 sm:gap-3 rounded-xl border border-white/[.07] bg-[#0c0f16] px-4 sm:px-5 text-xs sm:text-sm font-bold text-white hover:bg-[#121622] transition-colors"
        >
          <Settings size={18} className="text-[#b9a4ff]" />
          <span>Account settings</span>
        </Link>
        <LogoutButton className="btn min-h-11 sm:min-h-14 rounded-xl border border-red-500/20 bg-red-500/[.06] text-xs sm:text-sm font-bold text-red-200 hover:bg-red-500/10 transition-colors" />
      </section>
    </div>
  );
}
