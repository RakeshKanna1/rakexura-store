import { Megaphone, Tags } from "lucide-react";
import { redirect } from "next/navigation";
import { saveMarqueeMessage, saveStoreCategory, updateMarqueeMessage, updateStoreCategory } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";

const input = "h-11 rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#8b5cf6]";

export default async function StorefrontAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin");

  const [{ data: messages }, { data: categories }] = await Promise.all([
    supabase.from("marquee_messages").select("*").order("sort_order"),
    supabase.from("store_categories").select("*").order("sort_order"),
  ]);

  return <main>
    <p className="eyebrow">Homepage controls</p>
    <h1 className="mt-2 text-4xl font-black">Storefront</h1>
    <p className="mt-2 text-[#8991a6]">Change the scrolling announcement strip and customer-facing game categories without editing code.</p>

    <section className="mt-8 grid gap-6 xl:grid-cols-2">
      <div className="premium-panel rounded-lg p-5">
        <div className="flex items-center gap-3"><Megaphone className="text-[#a78bfa]" /><div><h2 className="text-xl font-black">Announcement strip</h2><p className="text-sm text-[#8991a6]">Active messages scroll across the homepage.</p></div></div>
        <form action={saveMarqueeMessage} className="mt-5 grid gap-3 sm:grid-cols-[1fr_130px_90px_auto]">
          <input className={input} name="message" required minLength={3} maxLength={160} placeholder="New games added weekly" aria-label="Announcement message" />
          <select className={input} name="icon_key" aria-label="Announcement icon"><option value="spark">Spark</option><option value="gamepad">Gamepad</option><option value="zap">Lightning</option><option value="cart">Cart</option><option value="message">Message</option><option value="flame">Flame</option></select>
          <input className={input} name="sort_order" type="number" defaultValue="10" aria-label="Sort order" />
          <button className="btn btn-primary">Add</button>
        </form>
        <div className="mt-5 space-y-2">{messages?.map((message) => <div key={message.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[.08] bg-black/20 p-3"><div><strong className={message.active ? "" : "text-[#697084] line-through"}>{message.message}</strong><p className="mt-1 text-xs text-[#8991a6]">{message.icon_key} · order {message.sort_order}</p></div><form action={updateMarqueeMessage} className="flex gap-2"><input type="hidden" name="id" value={message.id} /><button name="decision" value={message.active ? "disable" : "enable"} className="btn btn-secondary min-h-9 px-3 text-xs">{message.active ? "Hide" : "Show"}</button><button name="decision" value="delete" className="btn min-h-9 border border-red-500/30 bg-red-950/30 px-3 text-xs text-red-300">Delete</button></form></div>)}</div>
      </div>

      <div className="premium-panel rounded-lg p-5">
        <div className="flex items-center gap-3"><Tags className="text-[#a78bfa]" /><div><h2 className="text-xl font-black">Store categories</h2><p className="text-sm text-[#8991a6]">These appear on the homepage and in the game editor.</p></div></div>
        <form action={saveStoreCategory} className="mt-5 grid gap-3 sm:grid-cols-[1fr_130px_90px_auto]">
          <input className={input} name="name" required minLength={2} maxLength={40} placeholder="Adventure" aria-label="Category name" />
          <select className={input} name="icon_key" aria-label="Category icon"><option value="gamepad">Gamepad</option><option value="swords">Swords</option><option value="map">Map</option><option value="car">Car</option><option value="wand">Magic</option><option value="ghost">Horror</option><option value="trophy">Sports</option><option value="crosshair">Action</option><option value="bike">Simulation</option></select>
          <input className={input} name="sort_order" type="number" defaultValue="10" aria-label="Sort order" />
          <button className="btn btn-primary">Add</button>
        </form>
        <div className="mt-5 space-y-2">{categories?.map((category) => <div key={category.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[.08] bg-black/20 p-3"><div><strong className={category.active ? "" : "text-[#697084] line-through"}>{category.name}</strong><p className="mt-1 text-xs text-[#8991a6]">{category.icon_key} · order {category.sort_order}</p></div><form action={updateStoreCategory} className="flex gap-2"><input type="hidden" name="id" value={category.id} /><button name="decision" value={category.active ? "disable" : "enable"} className="btn btn-secondary min-h-9 px-3 text-xs">{category.active ? "Hide" : "Show"}</button><button name="decision" value="delete" className="btn min-h-9 border border-red-500/30 bg-red-950/30 px-3 text-xs text-red-300">Delete</button></form></div>)}</div>
      </div>
    </section>
  </main>;
}
