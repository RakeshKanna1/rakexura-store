import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { toggleBundle, deleteBundle } from "@/app/admin/actions";
import { AdminAccessDenied } from "@/components/admin/access-denied";
import { BundleForm } from "@/components/admin/bundle-form";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function AdminBundlesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/bundles");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return <AdminAccessDenied email={user.email} />;
  
  const [{ data: games }, { data: bundles }] = await Promise.all([
    supabase.from("games").select("id,title").eq("archived", false).order("title"),
    supabase.from("bundles").select("id,title,description,cover_image,original_price,bundle_price,active,offer_end_date,created_at,bundle_games(game_id, games(id,title))").order("id", { ascending: false })
  ]);
  
  const editing = query.edit ? bundles?.find((bundle) => bundle.id === Number(query.edit)) : null;
  
  return (
    <div className="py-10">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white">
        <ArrowLeft size={16} /> Control center
      </Link>
      <p className="eyebrow mt-7">Administration</p>
      <h1 className="mt-3 text-4xl font-black md:text-5xl">Combo deals</h1>
      <p className="section-copy">Build multi-game offers and control when they appear on the storefront.</p>
      
      <BundleForm games={games ?? []} bundle={editing ?? null} />
      
      <section className="mt-8 grid gap-3">
        {bundles?.map((bundle) => {
          const gameList = bundle.bundle_games
            ?.map((bg: { games: { title: string }[] | null }) => bg.games?.[0]?.title)
            .filter(Boolean)
            .join(", ") || "No games linked";

          return (
            <article key={bundle.id} className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-white/[.08] bg-[#0b0f19] p-4">
              <div>
                <strong className="text-white block text-base">{bundle.title}</strong>
                <p className="mt-1 text-sm text-[#8991a6]">
                  {formatPrice(bundle.bundle_price)} · {bundle.bundle_games.length} games · {bundle.active ? "Live" : "Paused"}
                  {bundle.offer_end_date && ` · Ends ${new Date(bundle.offer_end_date).toLocaleString("en-IN")}`}
                </p>
                <p className="mt-1.5 text-xs text-[#b9a4ff]/90">
                  <span className="opacity-60 text-white font-semibold">Included:</span> {gameList}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Link href={`/admin/bundles?edit=${bundle.id}`} className="btn btn-secondary text-xs min-h-9 px-3">
                  Edit
                </Link>
                <form action={toggleBundle}>
                  <input type="hidden" name="id" value={bundle.id} />
                  <input type="hidden" name="active" value={String(!bundle.active)} />
                  <button className="btn btn-secondary text-xs min-h-9 px-3">
                    {bundle.active ? "Pause" : "Activate"}
                  </button>
                </form>
                <form action={deleteBundle}>
                  <input type="hidden" name="id" value={bundle.id} />
                  <button className="btn border border-red-500/30 bg-red-950/20 text-xs text-red-300 min-h-9 px-3 hover:bg-red-950/40">
                    Delete
                  </button>
                </form>
              </div>
            </article>
          );
        })}
        {!bundles?.length && (
          <p className="rounded-md border border-white/[.08] p-8 text-center text-[#8991a6]">
            No combo deals yet.
          </p>
        )}
      </section>
    </div>
  );
}
