export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, PackageSearch, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ResellerBadge, ResellerIcon } from "@/components/ui/reseller-badge";
import { ResellerClientDeliveryCard } from "@/components/dashboard/reseller-client-delivery-card";
import { getGames } from "@/lib/supabase/queries";

export default async function ResellerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: orders }, games] = await Promise.all([
    supabase.from("profiles").select("display_name,role,is_reseller,reseller_discount,reseller_approved_at").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id,order_reference,order_status,total_price,created_at,cart_items,account_access").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    getGames(),
  ]);

  // If user is not a verified reseller, show onboarding / access request
  if (!profile?.is_reseller) {
    return (
      <main className="page-shell py-12 md:py-16">
        <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white transition">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="mt-8 max-w-2xl mx-auto rounded-2xl border border-white/10 bg-[#0c0919]/90 p-8 md:p-12 text-center backdrop-blur-xl shadow-2xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#facc15]/10 text-[#facc15] shadow-[0_0_24px_rgba(250,204,21,0.2)]">
            <ResellerIcon className="w-9 h-9" />
          </div>

          <h1 className="mt-6 text-3xl md:text-4xl font-black text-white">
            Rakexura Reseller Network
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#a0a8c0] leading-relaxed">
            Sell PC games and Game Passes to your own customers with exclusive wholesale pricing and instant delivery.
          </p>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center gap-2 text-[#facc15] font-bold text-sm">
                <Zap size={16} /> Wholesale Pricing
              </div>
              <p className="mt-1.5 text-xs text-[#8991a6]">
                Get 20% to 35% discount on top titles and passes.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center gap-2 text-[#70efbb] font-bold text-sm">
                <ShieldCheck size={16} /> Full Warranty
              </div>
              <p className="mt-1.5 text-xs text-[#8991a6]">
                Complete activation support and guarantees for your buyers.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`https://wa.me/919488941014?text=${encodeURIComponent(
                `Hi Rakexura! I would like to apply for a Verified Reseller account for email: ${user.email}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#facc15] px-6 py-3 text-sm font-black text-black transition hover:bg-[#ffe45c] hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] cursor-pointer"
            >
              <span>Apply for Reseller Badge</span>
              <ArrowRight size={16} />
            </a>
            <Link href="/dashboard" className="btn btn-secondary text-xs">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const discount = Number(profile.reseller_discount || 25);
  const deliveredOrders = (orders ?? []).filter((o) => o.order_status === "Delivered" && o.account_access);

  return (
    <main className="page-shell py-10 md:py-14 space-y-8">
      <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white transition">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      {/* RESELLER HERO STATUS CARD */}
      <section className="relative overflow-hidden rounded-2xl border border-[#facc15]/30 bg-gradient-to-b from-[#15102a] via-[#0c081e] to-black p-6 md:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(250,204,21,0.08)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#facc15]/10 filter blur-3xl" />
        
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <ResellerBadge size="lg" />
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                Partner Active
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Reseller Partner Portal
            </h1>
            <p className="text-sm md:text-base text-[#a0a8c0] max-w-xl">
              Welcome back, <strong className="text-white">{profile.display_name || "Partner"}</strong>. Your account is verified for wholesale pricing across the catalog.
            </p>
          </div>

          {/* Wholesale Discount Stat Badge */}
          <div className="rounded-xl border border-[#facc15]/40 bg-black/50 p-4 sm:p-5 text-right space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8991a6] block">
              Wholesale Discount Rate
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#facc15]">
              {discount}% OFF
            </span>
            <span className="text-[11px] text-[#a0a8c0] block">
              Applied automatically at checkout
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-white/10">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 rounded-xl bg-[#facc15] px-5 py-2.5 text-xs font-black text-black hover:bg-[#ffe45c] transition cursor-pointer"
          >
            <ShoppingBag size={15} />
            <span>Browse Wholesale Games</span>
          </Link>
          <a
            href="https://wa.me/919488941014?text=Hi%20Rakexura!%20I%20am%20a%20Verified%20Reseller%20and%20need%20priority%20support."
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink size={14} /> Priority WhatsApp Support
          </a>
        </div>
      </section>

      {/* QUICK CLIENT DELIVERY TOOL */}
      <section className="space-y-4">
        <div>
          <p className="eyebrow text-xs font-bold uppercase tracking-wider text-[#facc15]">
            Client Fulfillment Tool
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            Purchased Game Credentials &amp; Guides
          </h2>
          <p className="text-xs sm:text-sm text-[#8991a6]">
            One-click copy formatted download &amp; activation instructions ready to send directly to your buyers on WhatsApp.
          </p>
        </div>

        <div className="space-y-3">
          {deliveredOrders.map((order) => (
            <ResellerClientDeliveryCard key={order.id} order={order} />
          ))}

          {!deliveredOrders.length && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center text-[#8991a6]">
              <PackageSearch className="mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm font-semibold">No delivered orders with activation details yet.</p>
              <p className="text-xs mt-1">Once your wholesale orders are delivered by Rakexura, their client-ready instructions will appear here.</p>
            </div>
          )}
        </div>
      </section>

      {/* QUICK WHOLESALE CATALOG PREVIEW */}
      <section className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-xs font-bold uppercase tracking-wider text-[#8991a6]">
              Wholesale Rates
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              Instant Re-Order Catalog
            </h2>
            <p className="text-xs sm:text-sm text-[#8991a6]">
              Popular titles and Game Passes with your wholesale rate applied.
            </p>
          </div>
          <Link href="/games" className="text-xs font-bold text-[#facc15] hover:underline inline-flex items-center gap-1">
            View all {games.length} catalog games <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {games.slice(0, 8).map((game) => {
            const retailPrice = Number(game.sale_price || game.offline_price || game.steam_price || 299);
            const wholesalePrice = Number(
              game.reseller_price || Math.round(retailPrice * (1 - discount / 100))
            );

            return (
              <article key={game.id} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 flex flex-col justify-between hover:border-[#facc15]/30 transition">
                <div>
                  <span className="text-[11px] font-bold text-[#8991a6] block">#{game.id}</span>
                  <strong className="text-sm font-bold text-white block truncate">{game.title}</strong>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#8991a6] line-through block">
                      Retail: {formatPrice(retailPrice)}
                    </span>
                    <span className="text-base font-black text-[#facc15]">
                      {formatPrice(wholesalePrice)}
                    </span>
                  </div>

                  <Link
                    href={`/games/${game.slug || game.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-[#facc15] hover:text-black px-3 py-1.5 text-xs font-bold text-white transition"
                  >
                    <span>Order</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
