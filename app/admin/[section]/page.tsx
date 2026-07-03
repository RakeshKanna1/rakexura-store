import Link from "next/link";
import { ArrowLeft, HelpCircle, Phone, ReceiptText, ExternalLink } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameForm } from "@/components/admin/game-form";
import { CouponForm } from "@/components/admin/coupon-form";
import type { Game } from "@/types/store";
import { AdminAccessDenied } from "@/components/admin/access-denied";
import { MediaManager } from "@/components/admin/media-manager";
import { OrderActions } from "@/components/admin/order-actions";
import { SearchableTable } from "@/components/admin/searchable-table";

const sources = {
  games: { title: "Game management", table: "games", select: "id,title,steam_price,epic_price,offline_price,online_price,xbox_price,geforce_price,is_subscription,online_activation,duration,archived", order: "id" },
  orders: { title: "Customer orders", table: "orders", select: "id,order_reference,customer_name,customer_whatsapp,order_status,total_price,cart_items,screenshot_url,created_at,account_access", order: "created_at" },
  customers: { title: "Customer list", table: "profiles", select: "id,display_name,whatsapp,role,created_at", order: "created_at" },
  reviews: { title: "Review moderation", table: "reviews", select: "id,customer_name,rating,message,media_urls,verified_purchase,approved,created_at", order: "created_at" },
  coupons: { title: "Coupon management", table: "coupons", select: "id,code,discount_type,discount_value,usage_limit,per_user_limit,expires_at,active", order: "id" },
  support: { title: "Support conversations", table: "support_tickets", select: "id,subject,status,user_id,created_at,updated_at", order: "updated_at" },
  requests: { title: "Game requests", table: "game_requests", select: "id,game_name,platform,votes,status,created_at", order: "created_at" },
  media: { title: "Media manager", table: "customer_proofs", select: "id,image_url,caption,proof_type,approved,created_at", order: "created_at" },
  analytics: { title: "Analytics events", table: "analytics_events", select: "id,event_type,event_value,game_id,created_at", order: "created_at" },
} as const;

type AdminRow = Record<string, unknown> & { id?: number; screenshot_url?: string; proof_url?: string; media_urls?: string[]; media_links?: string[] };
type DynamicAdminClient = { from: (table: string) => { select: (columns: string) => { order: (column: string, options: { ascending: boolean }) => { limit: (count: number) => Promise<{ data: AdminRow[] | null }> } } } };

export default async function AdminSection({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { section } = await params;
  if (!(section in sources)) notFound();
  const source = sources[section as keyof typeof sources];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/admin/${section}`)}`);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return <AdminAccessDenied email={user.email} />;
  const dynamicClient = supabase as unknown as DynamicAdminClient;
  const { data } = await dynamicClient.from(source.table).select(source.select).order(source.order, { ascending: false }).limit(100);
  const rows = data ?? [];

  if (section === "coupons" && rows.length > 0) {
    const { data: usageCounts } = await supabase
      .from("coupon_usage")
      .select("coupon_id");
    const countsMap: Record<number, number> = {};
    if (usageCounts) {
      for (const usage of usageCounts) {
        const cid = Number(usage.coupon_id);
        countsMap[cid] = (countsMap[cid] || 0) + 1;
      }
    }
    for (const row of rows) {
      if (row.id) {
        row.used_count = countsMap[Number(row.id)] || 0;
      }
    }
  }
  const query = await searchParams;
  let editingGame: Game | null = null;
  let editingCoupon: { id: number; code: string; discount_type: string; discount_value: number; minimum_order: number | null; usage_limit: number | null; per_user_limit: number | null; expires_at: string | null } | null = null;
  let genres: string[] = [];
  if (section === "games") {
    const { data: categoryRows } = await supabase.from("store_categories").select("name").eq("active", true).order("sort_order");
    genres = categoryRows?.length ? categoryRows.map(({ name }) => name) : ["Action", "Adventure", "Open World", "Racing", "RPG", "Horror", "Sports", "Fighting", "Simulation", "Strategy", "Shooter", "Survival"];
    if (query.edit && /^\d+$/.test(query.edit)) {
      const { data: game } = await supabase.from("games").select("*").eq("id", Number(query.edit)).maybeSingle();
      editingGame = game as Game | null;
    }
  }
  if (section === "coupons" && query.edit && /^\d+$/.test(query.edit)) {
    const { data: coupon } = await supabase.from("coupons").select("id,code,discount_type,discount_value,minimum_order,usage_limit,per_user_limit,expires_at").eq("id", Number(query.edit)).maybeSingle();
    editingCoupon = coupon;
  }

  if (section === "orders") {
    await Promise.all(rows.map(async (row) => {
      if (!row.screenshot_url) return;
      const { data: signed } = await supabase.storage.from("payment-proofs").createSignedUrl(row.screenshot_url, 120);
      row.proof_url = signed?.signedUrl;
    }));
  }

  if (section === "reviews") {
    await Promise.all(rows.map(async (row) => {
      if (!Array.isArray(row.media_urls) || !row.media_urls.length) return;
      const { data: signed } = await supabase.storage.from("review-media").createSignedUrls(row.media_urls, 120);
      row.media_links = signed?.flatMap((item) => item.signedUrl ? [item.signedUrl] : []) ?? [];
    }));
  }

  if (section === "orders") {
    return <div className="py-10">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white"><ArrowLeft size={16} /> Admin home</Link>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Orders</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Review and deliver</h1><p className="section-copy">Check the payment proof, choose the next status, then send the prepared WhatsApp update.</p></div><span className="rounded-md border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-bold">{rows.length} orders</span></div>
      <aside className="mt-6 flex gap-3 rounded-md border border-[#8b5cf6]/25 bg-[#8b5cf6]/[.07] p-4 text-sm text-[#cbbfff]"><HelpCircle className="mt-0.5 shrink-0" size={18} /><div><strong className="text-white">Simple order flow</strong><p className="mt-1 leading-6">1. Open payment proof. 2. Verify payment. 3. Start delivery. 4. Mark delivered. Every change updates customer tracking and prepares the correct WhatsApp message.</p></div></aside>
      <div className="mt-6 space-y-3">{rows.map((row) => {
        const items = Array.isArray(row.cart_items) ? row.cart_items as Array<Record<string, unknown>> : [];
        const gameName = items.length ? items.map((item) => String(item.title || "Game")).join(", ") : "Order items";

        return <article key={String(row.id)} className="premium-panel bg-[#0f0c22]/80 border-[#8b5cf6]/20 rounded-lg p-5 transition hover:border-white/15 md:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-lg">{String(row.order_reference || `Order #${row.id}`)}</strong><span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-xs font-bold">{String(row.order_status || "Pending")}</span></div><p className="mt-2 text-sm text-[#a0a8c0]">{String(row.customer_name)} · {new Date(String(row.created_at)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-[#8991a6]"><span className="inline-flex items-center gap-1.5"><Phone size={13} />{String(row.customer_whatsapp || "No phone")}</span><span className="inline-flex items-center gap-1.5"><ReceiptText size={13} />{gameName}</span><strong className="text-white">₹{Number(row.total_price || 0).toLocaleString("en-IN")}</strong></div></div>
            <div className="space-y-3">{row.proof_url ? <a href={row.proof_url} target="_blank" rel="noreferrer" className="btn btn-secondary w-full text-xs"><ExternalLink size={14} /> View payment proof</a> : <p className="rounded-md border border-amber-400/20 bg-amber-400/[.06] px-3 py-2 text-xs text-amber-200">No payment proof attached</p>}<OrderActions id={Number(row.id)} currentStatus={String(row.order_status ?? "Pending")} customerPhone={String(row.customer_whatsapp || "")} gameName={gameName} orderReference={String(row.order_reference || `#${row.id}`)} initialAccountAccess={String(row.account_access || "")} totalPrice={Number(row.total_price || 0)} /></div>
          </div>
        </article>;
      })}{!rows.length && <p className="premium-panel bg-[#0f0c22]/80 border-[#8b5cf6]/20 rounded-lg p-10 text-center text-[#8991a6]">No orders need attention.</p>}</div>
    </div>;
  }

  const hidden = new Set(["screenshot_url", "proof_url", "media_urls", "media_links"]);
  const headers = (rows[0] ? Object.keys(rows[0]) : source.select.split(",")).filter((header) => !hidden.has(header));
  const hasActions = ["games", "orders", "reviews", "coupons", "requests", "support", "media"].includes(section);

  return (
    <div className="py-10">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white">
        <ArrowLeft size={16} /> Control center
      </Link>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">{source.title}</h1>
        </div>
        <span className="rounded bg-white/[.05] px-3 py-2 text-xs font-bold">{rows.length} records</span>
      </div>
      {section === "games" && <GameForm game={editingGame} genres={genres} />}
      {section === "coupons" && <CouponForm coupon={editingCoupon} />}
      {section === "media" && <MediaManager />}
      
      <div className="mt-8">
        <SearchableTable rows={rows} headers={headers} section={section} hasActions={hasActions} />
      </div>
    </div>
  );
}
