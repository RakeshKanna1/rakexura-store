import { HelpCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameForm } from "@/components/admin/game-form";
import { CouponForm } from "@/components/admin/coupon-form";
import type { Game } from "@/types/store";
import { MediaManager } from "@/components/admin/media-manager";
import { SearchableTable } from "@/components/admin/searchable-table";
import { FlashSaleForm } from "@/components/admin/flash-sale-form";
import { CampaignForm } from "@/components/admin/campaign-form";
import { CampaignGameForm } from "@/components/admin/campaign-game-form";
import { VisitorAnalytics } from "@/components/admin/visitor-analytics";

import { SmartOrdersManager, type OrderRow } from "@/components/admin/smart-orders-manager";
import { purgeExpiredCoupons } from "@/lib/supabase/coupons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const sources = {
  games: { title: "Game management", table: "games", select: "id,title,cover_image,steam_price,epic_price,offline_price,online_price,xbox_price,geforce_price,price_1m,price_2m,price_3m,price_6m,price_12m,reseller_price,is_subscription,online_activation,duration,archived", order: "id" },
  orders: { title: "Customer orders", table: "orders", select: "id,order_reference,customer_name,customer_whatsapp,order_status,total_price,cart_items,screenshot_url,created_at,account_access", order: "created_at" },
  customers: { title: "Customer list", table: "profiles", select: "id,display_name,email,whatsapp,role,is_reseller,reseller_discount,reseller_discount_type,created_at", order: "created_at" },
  reviews: { title: "Review moderation", table: "reviews", select: "id,customer_name,rating,message,media_urls,verified_purchase,approved,created_at", order: "created_at" },
  coupons: { title: "Coupon management", table: "coupons", select: "id,code,discount_type,discount_value,minimum_order,usage_limit,per_user_limit,expires_at,active", order: "id" },
  support: { title: "Support conversations", table: "support_tickets", select: "id,subject,status,user_id,created_at,updated_at", order: "updated_at" },
  requests: { title: "Game requests", table: "game_requests", select: "id,game_name,platform,votes,status,created_at", order: "created_at" },
  media: { title: "Media manager", table: "customer_proofs", select: "id,image_url,caption,proof_type,approved,created_at", order: "created_at" },
  analytics: { title: "Analytics & Visitor Monitor", table: "visitor_logs", select: "id,visitor_id,user_name,path,referrer,device_type,created_at", order: "created_at" },
  visitors: { title: "Live Visitors & Traffic", table: "visitor_logs", select: "id,visitor_id,user_name,path,referrer,device_type,created_at", order: "created_at" },
  "flash-sales": { title: "Flash sale management", table: "flash_sales", select: "id,game_id,sale_price,starts_at,ends_at,active", order: "ends_at" },
  "audit-logs": { title: "Admin audit logs", table: "audit_logs", select: "id,admin_id,action,affected_entity,entity_id,ip_address,created_at", order: "created_at" },
  campaigns: { title: "Campaign management", table: "campaigns", select: "id,name,slug,starts_at,ends_at,active", order: "id" },
  "campaign-games": { title: "Campaign game overrides", table: "campaign_games", select: "id,campaign_id,game_id,campaign_price,stock_limit", order: "id" },
} as const;

type AdminRow = Record<string, unknown> & { id?: number; screenshot_url?: string; proof_url?: string; media_urls?: string[]; media_links?: string[] };
type DynamicAdminClient = { from: (table: string) => { select: (columns: string) => { order: (column: string, options: { ascending: boolean }) => { limit: (count: number) => Promise<{ data: AdminRow[] | null }> } } } };

export default async function AdminSection({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { section } = await params;
  if (!(section in sources)) notFound();
  const source = sources[section as keyof typeof sources];
  const supabase = await createClient();

  if (section === "coupons") {
    await purgeExpiredCoupons(supabase);
  }

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
  let editingCoupon: { id: number; code: string; discount_type: string; discount_value: number; minimum_order: number | null; usage_limit: number | null; per_user_limit: number | null; expires_at: string | null; applicable_to?: string | null } | null = null;
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
    const { data: coupon } = await supabase.from("coupons").select("id,code,discount_type,discount_value,minimum_order,usage_limit,per_user_limit,expires_at,applicable_to").eq("id", Number(query.edit)).maybeSingle();
    editingCoupon = coupon;
  }

  let editingFlashSale = null;
  let gamesList: Array<{ id: number; title: string; original_price?: number | null; sale_price?: number | null; cover_image?: string | null; duration?: string | null; is_subscription?: boolean | null; price_1m?: number | null; price_2m?: number | null; price_3m?: number | null; price_6m?: number | null; price_12m?: number | null }> = [];
  if (section === "flash-sales") {
    const { data: dbGames } = await supabase.from("games").select("id,title,original_price,sale_price,cover_image,duration,is_subscription,price_1m,price_2m,price_3m,price_6m,price_12m").eq("archived", false).order("title");
    gamesList = dbGames || [];
    const gameMap = new Map(gamesList.map((g) => [g.id, g]));
    rows.forEach((row) => {
      const g = gameMap.get(Number(row.game_id));
      if (g) {
        row.game_title = g.title;
        row.cover_image = g.cover_image;
        row.is_subscription = g.is_subscription;
        row.duration = g.duration;
      }
    });
    if (query.edit && /^\d+$/.test(query.edit)) {
      const { data: flashSale } = await supabase.from("flash_sales").select("id,game_id,sale_price,price_2m,price_3m,price_6m,price_12m,starts_at,ends_at,active").eq("id", Number(query.edit)).maybeSingle();
      editingFlashSale = flashSale;
    }
  }

  let editingCampaign = null;
  if (section === "campaigns" && query.edit && /^\d+$/.test(query.edit)) {
    const { data: campaign } = await supabase.from("campaigns").select("id,name,slug,starts_at,ends_at,theme_color,banner_image,active").eq("id", Number(query.edit)).maybeSingle();
    editingCampaign = campaign;
  }

  let editingCampaignGame = null;
  let campaignsList: Array<{ id: number; name: string }> = [];
  if (section === "campaign-games") {
    const { data: dbCampaigns } = await supabase.from("campaigns").select("id,name").order("name");
    campaignsList = dbCampaigns || [];
    const { data: dbGames } = await supabase.from("games").select("id,title").eq("archived", false).order("title");
    gamesList = dbGames || [];
    if (query.edit && /^\d+$/.test(query.edit)) {
      const { data: campaignGame } = await supabase.from("campaign_games").select("id,campaign_id,game_id,campaign_price,stock_limit").eq("id", Number(query.edit)).maybeSingle();
      editingCampaignGame = campaignGame;
    }
  }

  if (section === "orders") {
    const proofPaths = rows.map((r) => String(r.screenshot_url || "")).filter(Boolean);
    if (proofPaths.length > 0) {
      const { data: signedList } = await supabase.storage.from("payment-proofs").createSignedUrls(proofPaths, 120);
      const urlMap = new Map((signedList || []).map((item) => [item.path, item.signedUrl]));
      rows.forEach((row) => {
        if (row.screenshot_url) {
          row.proof_url = urlMap.get(String(row.screenshot_url)) || undefined;
        }
      });
    }
  }

  if (section === "reviews") {
    const mediaPaths = rows.flatMap((r) => Array.isArray(r.media_urls) ? r.media_urls.map(String) : []);
    if (mediaPaths.length > 0) {
      const { data: signedList } = await supabase.storage.from("review-media").createSignedUrls(mediaPaths, 120);
      const urlMap = new Map((signedList || []).map((item) => [item.path, item.signedUrl]));
      rows.forEach((row) => {
        if (Array.isArray(row.media_urls) && row.media_urls.length) {
          row.media_links = row.media_urls.map((path: string) => urlMap.get(String(path))).filter((url): url is string => Boolean(url));
        }
      });
    }
  }

  if (section === "orders") {
    return <SmartOrdersManager initialOrders={rows as unknown as OrderRow[]} />;
  }

  const hidden = new Set(["screenshot_url", "proof_url", "media_urls", "media_links", "reseller_discount", "is_reseller", "reseller_discount_type"]);
  const headers = (rows[0] ? Object.keys(rows[0]) : source.select.split(",")).filter((header) => !hidden.has(header));
  const hasActions = ["games", "orders", "customers", "reviews", "coupons", "requests", "support", "media", "flash-sales", "campaigns", "campaign-games"].includes(section);

  return (
    <div className="py-2 md:py-4">
      <div className="mt-4 md:mt-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">{source.title}</h1>
        </div>
        <span className="rounded bg-white/[.05] px-3 py-2 text-xs font-bold">{rows.length} records</span>
      </div>
      {section === "flash-sales" && (
        <aside className="mt-6 flex gap-3 rounded-md border border-[#facc15]/25 bg-[#facc15]/[.07] p-4 text-sm text-[#fbeab8]">
          <HelpCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <strong className="text-white">How Flash Sales Work</strong>
            <ul className="mt-1 list-decimal pl-4 space-y-1 leading-6">
              <li>Choose an active game from the dropdown and set the discounted <b>Sale Price</b> in Rupees.</li>
              <li>Define the <b>Starts at</b> and <b>Ends at</b> times (this controls when the countdown starts and stops).</li>
              <li>Ensure the <b>Active</b> toggle is checked.</li>
              <li>The storefront homepage will automatically display the card with a ticking real-time countdown timer, and hide it when the sale expires.</li>
            </ul>
          </div>
        </aside>
      )}
      {section === "games" && <GameForm game={editingGame} genres={genres} />}
      {section === "coupons" && <CouponForm coupon={editingCoupon} />}
      {section === "media" && <MediaManager />}
      {section === "flash-sales" && <FlashSaleForm flashSale={editingFlashSale} games={gamesList} />}
      {section === "campaigns" && <CampaignForm campaign={editingCampaign} />}
      {section === "campaign-games" && <CampaignGameForm campaignGame={editingCampaignGame} campaigns={campaignsList} games={gamesList} />}
      {(section === "analytics" || section === "visitors") && (
        <div className="mt-8">
          <VisitorAnalytics />
        </div>
      )}
      
      <div className="mt-8">
        <SearchableTable rows={rows} headers={headers} section={section} hasActions={hasActions} />
      </div>
    </div>
  );
}
