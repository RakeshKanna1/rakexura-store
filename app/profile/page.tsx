import Image from "next/image";
import Link from "next/link";
import { Bell, Gamepad2, Heart, LifeBuoy, PackageSearch, Settings, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/account/logout-button";
import { createClient } from "@/lib/supabase/server";

const OWNER_EMAIL = "12k21rakeshkannam@gmail.com";
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

  return <div className="page-shell py-8 md:py-12">
    <header className="flex items-center gap-4"><span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[#6d4aff]/20 text-xl font-black text-[#d4caff]">{profile?.avatar_url ? <Image src={profile.avatar_url} alt={`${name} profile picture`} fill sizes="56px" className="object-cover" unoptimized /> : name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="eyebrow">Your account</p><h1 className="mt-1 truncate text-3xl font-black">{name}</h1><p className="mt-1 truncate text-sm text-[#8991a6]">{user.email}</p></div></header>
    {(profile?.role === "admin" || owner) && <Link href="/admin" className="mt-6 flex min-h-14 max-w-sm items-center gap-3 rounded-md border border-[#8b5cf6]/25 bg-[#8b5cf6]/[.08] px-5 font-black text-[#d4caff]"><ShieldCheck size={19} />{profile?.role === "admin" ? "Open admin dashboard" : "Activate admin access"}</Link>}
    <section className="mt-8"><h2 className="text-lg font-black">Quick access</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">{shortcuts.map(([href, label, Icon]) => <Link href={href} key={href} className="flex min-h-24 flex-col justify-between rounded-md border border-white/[.08] bg-[#0b0f19] p-4 transition hover:-translate-y-0.5 hover:border-white/20"><Icon size={20} className="text-[#b9a4ff]" /><span className="text-sm font-bold">{label}</span></Link>)}</div></section>
    <section className="mt-8 grid gap-3 sm:grid-cols-2"><Link href="/dashboard/settings" className="flex min-h-14 items-center gap-3 rounded-md border border-white/[.08] bg-[#0b0f19] px-5 font-bold"><Settings size={19} className="text-[#b9a4ff]" /> Account settings</Link><LogoutButton className="btn min-h-14 border border-red-400/20 bg-red-500/[.06] text-red-200 hover:bg-red-500/10" /></section>
  </div>;
}
