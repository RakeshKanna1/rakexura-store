"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, Gamepad2, Heart, LayoutDashboard, PackageSearch, Settings, ShieldCheck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { OWNER_EMAIL } from "@/lib/config";
import { ResellerBadge, ResellerIcon } from "@/components/ui/reseller-badge";

import { useCartStore } from "@/stores/cart-store";

type Account = { email: string; name: string; role: string; avatarUrl?: string | null; isReseller?: boolean; resellerDiscount?: number } | null;

export function AccountMenu() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [account, setAccount] = useState<Account>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const setResellerStatus = useCartStore((state) => state.setResellerStatus);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const user = session?.user;
      if (!user) {
        setAccount(null);
        setResellerStatus(false, 0);
        setReady(true);
        setOpen(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("display_name,role,avatar_url,is_reseller,reseller_discount").eq("id", user.id).maybeSingle();
      const isReseller = Boolean(profile?.is_reseller);
      const resellerDiscount = Number(profile?.reseller_discount || 0);
      setResellerStatus(isReseller, resellerDiscount);
      setAccount({
        email: user.email ?? "Rakexura account",
        name: profile?.display_name || user.user_metadata?.display_name || user.user_metadata?.full_name || "Player",
        role: profile?.role ?? "customer",
        avatarUrl: profile?.avatar_url,
        isReseller,
        resellerDiscount,
      });
      setReady(true);
    } catch {
      setAccount(null);
      setReady(true);
    }
  }, [setResellerStatus]);

  useEffect(() => {
    const supabase = createClient();
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void load());
    const refresh = () => void load();
    window.addEventListener("rakexura-profile-updated", refresh);
    window.addEventListener("rakexura-role-updated", refresh);
    window.addEventListener("rakexura-auth-updated", refresh);
    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("rakexura-profile-updated", refresh);
      window.removeEventListener("rakexura-role-updated", refresh);
      window.removeEventListener("rakexura-auth-updated", refresh);
    };
  }, [load]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!ready || !account) return <Link href="/login" className="btn btn-secondary relative h-11 min-h-11 px-3" aria-label="Sign in to your account"><UserRound size={19} /></Link>;

  const links = [["/dashboard", "Dashboard", LayoutDashboard], ["/dashboard/orders", "My orders", PackageSearch], ["/dashboard/library", "My games", Gamepad2], ["/wishlist", "Wishlist", Heart], ["/dashboard/notifications", "Notifications", Bell], ["/dashboard/settings", "Account settings", Settings]] as const;
  const owner = account.email.toLowerCase() === OWNER_EMAIL;

  return <div ref={menuRef} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="btn btn-secondary gap-2" aria-label="Open profile menu" aria-expanded={open}>
      <span className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[#6d4aff]/20 text-xs font-black text-[#d4caff]">{account.avatarUrl ? <Image src={account.avatarUrl} alt="" fill sizes="28px" className="object-cover" unoptimized /> : account.name.slice(0, 1).toUpperCase()}</span>
      <span className="hidden max-w-24 truncate sm:inline">{account.name}</span>
      {account.isReseller && <ResellerIcon className="w-3.5 h-3.5 text-[#facc15] shrink-0" />}
      <ChevronDown size={14} className={`hidden transition sm:block ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-lg border border-white/10 bg-[#0b0f18]/98 p-2 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-white/[.07] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <strong className="block truncate text-sm">{account.name}</strong>
          {account.isReseller && <ResellerBadge size="sm" />}
        </div>
        <span className="mt-1 block truncate text-xs text-[#8991a6]">{account.email}</span>
      </div>
      {(account.role === "admin" || owner) && <Link href="/admin" className="mt-2 flex min-h-12 items-center gap-3 rounded-md border border-[#8b5cf6]/25 bg-[#8b5cf6]/[.08] px-3 text-sm font-black text-[#d4caff]"><ShieldCheck size={18} /> {account.role === "admin" ? "Admin dashboard" : "Activate admin access"}</Link>}
      <nav className="py-2">{links.map(([href, label, Icon]) => <Link key={href} href={href} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-[#b8bfd0] transition hover:bg-white/[.06] hover:text-white"><Icon size={17} />{label}</Link>)}</nav>
      <LogoutButton compact className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" />
    </div>}
  </div>;
}
