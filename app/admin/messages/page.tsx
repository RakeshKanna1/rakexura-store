import { BroadcastComposer, type OrderOption } from "@/components/admin/broadcast-composer";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export default async function AdminMessagesPage({ searchParams }: { searchParams?: Promise<{ prefill?: string }> }) {
  let prefill = "";
  if (searchParams) {
    try {
      const query = await Promise.resolve(searchParams);
      prefill = query?.prefill ?? "";
    } catch {
      prefill = "";
    }
  }

  const supabase = await createClient();
  const emailMap = new Map<string, string>();

  // 1. Try secure Postgres RPC function get_customer_emails
  try {
    const { data: rpcEmails } = await supabase.rpc("get_customer_emails");
    if (Array.isArray(rpcEmails)) {
      rpcEmails.forEach((item: { id: string; email: string }) => {
        if (item && item.id && item.email) emailMap.set(item.id, item.email);
      });
    }
  } catch (e) {
    console.warn("RPC get_customer_emails fallback:", e);
  }

  // 2. Try Admin auth.admin.listUsers() API if service key present
  if (emailMap.size === 0) {
    try {
      const adminSupabase = createAdminClient();
      const { data: authData } = await adminSupabase.auth.admin.listUsers();
      if (authData?.users) {
        authData.users.forEach((u) => {
          if (u && u.id && u.email) {
            emailMap.set(u.id, u.email);
          }
        });
      }
    } catch (err) {
      console.warn("Could not list auth users for email map:", err);
    }
  }

  let rawOrders: OrderOption[] = [];
  let rawCustomers: Array<{ id: string; display_name: string | null; whatsapp: string | null; email?: string | null }> = [];
  let games: Array<{
    id: number;
    title: string;
    slug?: string | null;
    cover_url?: string | null;
    banner_url?: string | null;
    sale_price?: number | null;
    original_price?: number | null;
    offline_price?: number | null;
    steam_price?: number | null;
    discount_percent?: number | null;
  }> = [];

  try {
    const [custRes, gamesRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("id,display_name,whatsapp,email").eq("role", "customer").order("display_name"),
      supabase.from("games").select("*").order("title"),
      supabase.from("orders").select("id,order_reference,user_id,game_id,variant_type,total_price,cart_items,customer_name,customer_whatsapp,order_status,created_at").order("created_at", { ascending: false }).limit(50)
    ]);
    if (custRes.data) rawCustomers = custRes.data.filter(Boolean);
    if (gamesRes.data) games = gamesRes.data.filter(Boolean);
    if (gamesRes.error) console.error("Games fetch error in admin messages:", gamesRes.error);
    if (ordersRes.data) rawOrders = (ordersRes.data.filter(Boolean) as unknown) as OrderOption[];
  } catch (err) {
    console.warn("Data fetch fallback in admin messages:", err);
  }

  const customers = rawCustomers.map((c) => {
    const email = c.email || emailMap.get(c.id) || null;
    return {
      ...c,
      email,
    };
  });

  // Sync missing emails to profiles table in background if service key is active
  if (emailMap.size > 0) {
    const adminSupabase = createAdminClient();
    const missingSync = rawCustomers.filter((c) => !c.email && emailMap.has(c.id));
    if (missingSync.length > 0) {
      void Promise.allSettled(
        missingSync.map((c) => adminSupabase.from("profiles").update({ email: emailMap.get(c.id) }).eq("id", c.id))
      );
    }
  }

  return (
    <main className="py-2 md:py-4">
      <p className="eyebrow">Customer communication</p>
      <h1 className="mt-2 md:mt-3 text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight">
        Messages & announcements
      </h1>
      <p className="section-copy text-xs sm:text-sm text-[#8991a6] mt-1 mb-5 md:mb-8">
        Tell customers about new games, offers, and giveaways without editing code.
      </p>
      <BroadcastComposer customers={customers} games={games} orders={rawOrders} prefill={prefill} />
    </main>
  );
}
