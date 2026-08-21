export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ExternalLink, PackageSearch, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ResellerBadge, ResellerIcon } from "@/components/ui/reseller-badge";
import { ResellerClientDeliveryCard } from "@/components/dashboard/reseller-client-delivery-card";
import { getGames } from "@/lib/supabase/queries";
import { WHATSAPP_NUMBER } from "@/lib/config";

export default async function ResellerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: orders }, games] = await Promise.all([
    supabase.from("profiles").select("display_name,role,is_reseller,reseller_discount,reseller_approved_at").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id,order_reference,order_status,total_price,created_at,cart_items,account_access").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    getGames(),
  ]);

  const hasResellerAccess = Boolean(profile?.is_reseller || profile?.role === "admin");

  // If user is not a verified reseller or admin, show clean centered Epic-styled onboarding card
  if (!hasResellerAccess) {
    return (
      <main className="page-shell flex min-h-[calc(100vh-140px)] items-center justify-center py-6">
        <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#11131a] p-6 sm:p-10 text-center shadow-2xl space-y-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.2)]">
            <ResellerIcon className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#facc15] block mb-1">
              Official Partner Program
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Rakexura Reseller Network
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#8f96a8] leading-relaxed max-w-md mx-auto">
              Supply PC games and Game Passes directly to your customers with exclusive wholesale pricing, instant delivery, and full warranty.
            </p>
          </div>

          <div className="grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#161922] p-4">
              <div className="flex items-center gap-2 text-[#facc15] font-bold text-xs">
                <Zap size={15} /> Wholesale Discounts
              </div>
              <p className="mt-1 text-[11px] text-[#8f96a8] leading-normal">
                Dedicated margin discounts on catalog games, passes, and combo packages.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#161922] p-4">
              <div className="flex items-center gap-2 text-[#00d68f] font-bold text-xs">
                <ShieldCheck size={15} /> Full Warranty
              </div>
              <p className="mt-1 text-[11px] text-[#8f96a8] leading-normal">
                Instant activation support and full replacement guarantees for your buyers.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `Hi Rakexura! I would like to apply for a Verified Reseller account for email: ${user.email}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#facc15] px-5 py-2.5 text-xs font-black text-black transition hover:bg-[#ffe45c] active:scale-[0.98] shadow-lg cursor-pointer"
            >
              <span>Apply for Reseller Access</span>
              <ArrowRight size={14} />
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-[#8f96a8] hover:text-white hover:bg-white/10 transition"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const discount = Number(profile?.reseller_discount || 25);
  const deliveredOrders = (orders ?? []).filter((o) => o.order_status === "Delivered" && o.account_access);

  return (
    <main className="page-shell py-6 md:py-10 space-y-8">
      {/* RESELLER HERO STATUS CARD */}
      <section className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#11131a] p-6 md:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#facc15]/5 filter blur-3xl" />
        
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <ResellerBadge size="lg" />
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                Partner Active
              </span>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Reseller Partner Portal
            </h1>
            <p className="text-xs md:text-sm text-[#8f96a8] max-w-xl leading-relaxed">
              Welcome back, <strong className="text-white">{profile?.display_name || "Partner"}</strong>. Your account is verified for wholesale pricing across the catalog.
            </p>
          </div>

          {/* Wholesale Discount Stat Badge */}
          <div className="rounded-xl border border-white/10 bg-[#161922] p-4 sm:p-5 text-right space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8f96a8] block">
              Active Wholesale Margin
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#facc15]">
              {discount}% OFF Retail
            </span>
            <span className="text-[11px] text-[#8f96a8] block">
              Applied automatically at checkout
            </span>
          </div>
        </div>

        {/* Quick Shortcut Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <a
            href="#client-delivery"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161922] px-3 py-1.5 text-xs font-bold text-white hover:border-[#facc15]/40 hover:text-[#facc15] transition"
          >
            <PackageSearch size={14} /> Client Delivery Tool
          </a>
          <a
            href="#wholesale-catalog"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161922] px-3 py-1.5 text-xs font-bold text-white hover:border-[#facc15]/40 hover:text-[#facc15] transition"
          >
            <ShoppingBag size={14} /> Wholesale Store Catalog
          </a>
          <Link
            href="/games"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161922] px-3 py-1.5 text-xs font-bold text-[#8f96a8] hover:text-white transition"
          >
            Browse Full Store <ExternalLink size={13} />
          </Link>
        </div>
      </section>

      {/* 1-CLICK CLIENT DELIVERY HUB */}
      <section id="client-delivery" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <PackageSearch className="text-[#facc15] h-5 w-5" /> 1-Click Client Delivery Tool
            </h2>
            <p className="text-xs text-[#8f96a8] mt-0.5">
              Instantly format activation keys and download instructions ready to send to your buyers on WhatsApp.
            </p>
          </div>
        </div>

        {deliveredOrders.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {deliveredOrders.map((order) => (
              <ResellerClientDeliveryCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#11131a] p-8 text-center space-y-3">
            <PackageSearch className="mx-auto h-8 w-8 text-[#8f96a8]" />
            <p className="text-sm font-bold text-white">No delivered keys yet</p>
            <p className="text-xs text-[#8f96a8] max-w-sm mx-auto">
              When you purchase games using your wholesale reseller account, keys and credentials will appear here for 1-click buyer forwarding.
            </p>
          </div>
        )}
      </section>

      {/* WHOLESALE QUICK RE-ORDER CATALOG */}
      <section id="wholesale-catalog" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ShoppingBag className="text-[#facc15] h-5 w-5" /> Instant Wholesale Catalog
            </h2>
            <p className="text-xs text-[#8f96a8] mt-0.5">
              Order directly at wholesale reseller rates. Pricing reflects your verified partner discount.
            </p>
          </div>
          <Link
            href="/games"
            className="text-xs font-bold text-[#b9a4ff] hover:underline inline-flex items-center gap-1"
          >
            View all games <ExternalLink size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {games.slice(0, 15).map((game) => {
            const retail = Number(game.sale_price || game.original_price || game.steam_price || 0);
            const customResellerPrice = game.reseller_price ? Number(game.reseller_price) : null;
            const resellerPrice = customResellerPrice !== null
              ? customResellerPrice
              : Math.max(0, Math.round(retail * (1 - discount / 100)));
            const platformStr = game.available_platforms?.length ? game.available_platforms.slice(0, 2).join(", ") : "Steam / Epic";

            return (
              <div
                key={game.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#11131a] p-3.5 hover:border-white/20 transition"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#161922]">
                    <Image
                      src={game.cover_image || "/Assets/placeholder.png"}
                      alt={game.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <strong className="mt-2.5 block text-xs font-bold text-white line-clamp-1">
                    {game.title}
                  </strong>
                  <span className="text-[10px] text-[#8f96a8] block">
                    {platformStr}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#8f96a8] line-through block leading-none">
                      {formatPrice(retail)}
                    </span>
                    <span className="text-xs font-black text-[#facc15] block leading-tight">
                      {formatPrice(resellerPrice)}
                    </span>
                  </div>

                  <Link
                    href={`/games/${game.slug || game.id}`}
                    className="rounded-lg bg-white/10 hover:bg-[#facc15] hover:text-black p-2 text-white transition cursor-pointer"
                    title={`Buy ${game.title} at wholesale`}
                  >
                    <ShoppingBag size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
