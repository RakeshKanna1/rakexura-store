import { Megaphone, Tags } from "lucide-react";
import { deleteMarqueeMessage, deleteStoreCategory, saveMarqueeMessage, saveStoreCategory, toggleMarqueeMessage, toggleStoreCategory } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";

const input = "w-full min-w-0 h-10 rounded-md border border-white/10 bg-black/40 px-3 text-xs sm:text-sm outline-none focus:border-[#8b5cf6] transition";

export default async function StorefrontAdminPage() {
  const supabase = await createClient();

  const [{ data: messages }, { data: categories }] = await Promise.all([
    supabase.from("marquee_messages").select("*").order("sort_order"),
    supabase.from("store_categories").select("*").order("sort_order"),
  ]);

  return (
    <main className="min-w-0 max-w-full">
      <p className="eyebrow">Homepage controls</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-black">Storefront</h1>
      <p className="mt-2 text-sm text-[#8991a6]">
        Change the scrolling announcement strip and customer-facing game categories without editing code.
      </p>

      <section className="mt-6 sm:mt-8 grid gap-6 2xl:grid-cols-2">
        {/* Announcement Strip */}
        <div className="premium-panel rounded-lg p-4 sm:p-5 min-w-0 overflow-hidden">
          <div className="flex items-center gap-3">
            <Megaphone className="text-[#a78bfa] shrink-0" size={22} />
            <div>
              <h2 className="text-lg sm:text-xl font-black">Announcement strip</h2>
              <p className="text-xs sm:text-sm text-[#8991a6]">Active messages scroll across the homepage.</p>
            </div>
          </div>

          <form action={saveMarqueeMessage} className="mt-5 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_70px_auto] gap-2.5 items-center">
            <input
              className={input}
              name="message"
              required
              minLength={3}
              maxLength={160}
              placeholder="New games added weekly"
              aria-label="Announcement message"
            />
            <select className={input} name="icon_key" aria-label="Announcement icon">
              <option value="spark">Spark</option>
              <option value="gamepad">Gamepad</option>
              <option value="zap">Lightning</option>
              <option value="cart">Cart</option>
              <option value="message">Message</option>
              <option value="flame">Flame</option>
            </select>
            <input
              className={input}
              name="sort_order"
              type="number"
              defaultValue="10"
              aria-label="Sort order"
            />
            <button className="btn btn-primary min-h-10 px-4 text-xs font-bold shrink-0">
              Add
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {messages?.map((message) => (
              <div
                key={message.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[.08] bg-black/20 p-3 min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <strong className={`block text-xs sm:text-sm truncate ${message.active ? "text-white" : "text-[#697084] line-through"}`}>
                    {message.message}
                  </strong>
                  <p className="mt-0.5 text-[11px] text-[#8991a6]">
                    {message.icon_key} · order {message.sort_order}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <form action={toggleMarqueeMessage}>
                    <input type="hidden" name="id" value={message.id} />
                    <input type="hidden" name="active" value={message.active ? "false" : "true"} />
                    <button className="btn btn-secondary min-h-8 px-2.5 text-xs font-semibold">
                      {message.active ? "Hide" : "Show"}
                    </button>
                  </form>
                  <form action={deleteMarqueeMessage}>
                    <input type="hidden" name="id" value={message.id} />
                    <button className="btn min-h-8 border border-red-500/30 bg-red-950/30 px-2.5 text-xs font-semibold text-red-300 hover:bg-red-900/40">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Categories */}
        <div className="premium-panel rounded-lg p-4 sm:p-5 min-w-0 overflow-hidden">
          <div className="flex items-center gap-3">
            <Tags className="text-[#a78bfa] shrink-0" size={22} />
            <div>
              <h2 className="text-lg sm:text-xl font-black">Store categories</h2>
              <p className="text-xs sm:text-sm text-[#8991a6]">These appear on the homepage and in the game editor.</p>
            </div>
          </div>

          <form action={saveStoreCategory} className="mt-5 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_70px_auto] gap-2.5 items-center">
            <input
              className={input}
              name="name"
              required
              minLength={2}
              maxLength={40}
              placeholder="Adventure"
              aria-label="Category name"
            />
            <select className={input} name="icon_key" aria-label="Category icon">
              <option value="gamepad">Gamepad</option>
              <option value="swords">Swords</option>
              <option value="map">Map</option>
              <option value="car">Car</option>
              <option value="wand">Magic</option>
              <option value="ghost">Horror</option>
              <option value="trophy">Sports</option>
              <option value="crosshair">Action</option>
              <option value="bike">Simulation</option>
            </select>
            <input
              className={input}
              name="sort_order"
              type="number"
              defaultValue="10"
              aria-label="Sort order"
            />
            <button className="btn btn-primary min-h-10 px-4 text-xs font-bold shrink-0">
              Add
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {categories?.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[.08] bg-black/20 p-3 min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <strong className={`block text-xs sm:text-sm truncate ${category.active ? "text-white" : "text-[#697084] line-through"}`}>
                    {category.name}
                  </strong>
                  <p className="mt-0.5 text-[11px] text-[#8991a6]">
                    {category.icon_key} · order {category.sort_order}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <form action={toggleStoreCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="active" value={category.active ? "false" : "true"} />
                    <button className="btn btn-secondary min-h-8 px-2.5 text-xs font-semibold">
                      {category.active ? "Hide" : "Show"}
                    </button>
                  </form>
                  <form action={deleteStoreCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <button className="btn min-h-8 border border-red-500/30 bg-red-950/30 px-2.5 text-xs font-semibold text-red-300 hover:bg-red-900/40">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
