import Link from "next/link";
import { toggleBundle, deleteBundle } from "@/app/admin/actions";
import { BundleForm } from "@/components/admin/bundle-form";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function AdminBundlesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  
  const [{ data: games }, { data: bundles }] = await Promise.all([
    supabase.from("games").select("id,title").eq("archived", false).order("title"),
    supabase.from("bundles").select("id,title,description,cover_image,original_price,bundle_price,active,offer_end_date,created_at,bundle_games(game_id, games(id,title))").order("id", { ascending: false })
  ]);
  
  const editing = query.edit ? bundles?.find((bundle) => bundle.id === Number(query.edit)) : null;
  
  return (
    <div className="pb-6 pt-0.5">
      <p className="eyebrow text-xs font-bold uppercase tracking-[.14em] text-[#8991a6]">Administration</p>
      <h1 className="mt-3 text-4xl font-black md:text-5xl text-white">Combo deals</h1>
      <p className="section-copy">Build multi-game offers and control when they appear on the storefront.</p>
      
      <BundleForm games={games ?? []} bundle={editing ?? null} />
      
      <section className="mt-8 grid gap-3">
        {bundles?.map((bundle) => {
          const gameList = bundle.bundle_games
            ?.map((bg: { games: { title: string } | { title: string }[] | null }) => {
              if (!bg?.games) return null;
              if (Array.isArray(bg.games)) return bg.games[0]?.title;
              return (bg.games as { title: string }).title;
            })
            .filter(Boolean)
            .join(", ") || "No games linked";

          return (
            <article key={bundle.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[.08] bg-[#0c0f18]/90 p-5 backdrop-blur-xl transition-all hover:border-[#8b5cf6]/30">
              <div>
                <strong className="text-white block text-base font-black">{bundle.title}</strong>
                <p className="mt-1 text-sm text-[#8991a6] flex items-center gap-2 flex-wrap">
                  <span className="font-black text-[#facc15] text-base">{formatPrice(bundle.bundle_price)}</span>
                  <span>·</span>
                  <span>{bundle.bundle_games.length} games</span>
                  <span>·</span>
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold ${bundle.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                    {bundle.active ? "Live" : "Paused"}
                  </span>
                  {bundle.offer_end_date && <span className="text-xs text-[#8991a6]">· Ends {new Date(bundle.offer_end_date).toLocaleString("en-IN")}</span>}
                </p>
                <p className="mt-2 text-xs text-[#c4b5fd]">
                  <span className="opacity-70 text-[#8991a6] font-semibold">Included:</span> {gameList}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Link href={`/admin/bundles?edit=${bundle.id}`} className="btn btn-secondary text-xs min-h-9 px-3.5 border-white/10 hover:border-[#8b5cf6]/40 hover:text-[#c4b5fd]">
                  Edit
                </Link>
                <form action={toggleBundle}>
                  <input type="hidden" name="id" value={bundle.id} />
                  <input type="hidden" name="active" value={String(!bundle.active)} />
                  <button className="btn btn-secondary text-xs min-h-9 px-3.5 border-white/10 hover:border-[#facc15]/40 hover:text-[#facc15]">
                    {bundle.active ? "Pause" : "Activate"}
                  </button>
                </form>
                <form action={deleteBundle}>
                  <input type="hidden" name="id" value={bundle.id} />
                  <button className="btn border border-red-500/30 bg-red-950/20 text-xs text-red-300 min-h-9 px-3.5 hover:bg-red-950/40 cursor-pointer">
                    Delete
                  </button>
                </form>
              </div>
            </article>
          );
        })}
        {!bundles?.length && (
          <p className="rounded-xl border border-white/[.08] bg-[#0c0f18]/60 p-8 text-center text-[#8991a6]">
            No combo deals yet.
          </p>
        )}
      </section>
    </div>
  );
}
