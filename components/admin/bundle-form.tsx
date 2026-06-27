import Image from "next/image";
import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { saveBundle } from "@/app/admin/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import { assetUrl } from "@/lib/utils";

type GameChoice = { id: number; title: string };
type BundleEdit = {
  id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  original_price: number;
  bundle_price: number;
  active: boolean;
  bundle_games?: Array<{ game_id: number }>;
  offer_end_date?: string | null;
};
const field = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#8b5cf6]";

export function BundleForm({ games, bundle }: { games: GameChoice[]; bundle?: BundleEdit | null }) {
  const selected = new Set(bundle?.bundle_games?.map((item) => item.game_id) ?? []);
  
  return (
    <form key={bundle?.id ?? "new"} action={saveBundle} className="premium-panel mt-8 rounded-md p-5 md:p-7">
      <input type="hidden" name="id" value={bundle?.id ?? ""} />
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Combo builder</p>
              <h2 className="mt-2 text-2xl font-black">{bundle ? `Edit ${bundle.title}` : "Create a bundle"}</h2>
            </div>
            {bundle && (
              <Link href="/admin/bundles" className="btn btn-secondary">
                Cancel edit
              </Link>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">
              Bundle title
              <input name="title" required defaultValue={bundle?.title ?? ""} className={field} />
            </label>
            <label className="text-sm font-bold">
              Original total
              <input name="original_price" type="number" min="0" defaultValue={bundle?.original_price ?? ""} className={field} />
            </label>
            <label className="text-sm font-bold">
              Bundle price
              <input name="bundle_price" type="number" min="0" required defaultValue={bundle?.bundle_price ?? ""} className={field} />
            </label>
            <label className="text-sm font-bold">
              Offer end date
              <input
                type="datetime-local"
                name="offer_end_date"
                defaultValue={bundle?.offer_end_date ? new Date(bundle.offer_end_date).toISOString().slice(0, 16) : ""}
                className={field}
              />
            </label>
            <label className="text-sm font-bold sm:col-span-2">
              Description
              <textarea name="description" rows={4} defaultValue={bundle?.description ?? ""} className={`${field} h-auto py-3`} />
            </label>
          </div>

          <div className="mt-5 max-w-xs">
            <ImageUploader name="cover_image" label="Bundle cover" initial={bundle?.cover_image} type="cover" />
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-bold">Included games</legend>
            <p className="mt-1 text-xs text-[#8991a6]">Select two or more titles. Hold Ctrl on Windows to select several games.</p>
            <select
              name="game_ids"
              multiple
              required
              defaultValue={[...selected].map(String)}
              className="mt-3 min-h-48 w-full rounded-md border border-white/10 bg-[#090c14] p-3 text-sm"
            >
              {games.map((game) => (
                <option key={game.id} value={game.id} className="py-2">
                  {game.title}
                </option>
              ))}
            </select>
          </fieldset>

          <label className="mt-4 flex min-h-11 items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="active" defaultChecked={bundle?.active ?? true} />
            Active on storefront
          </label>

          <button className="btn btn-primary mt-5">
            <PackagePlus size={17} /> {bundle ? "Update bundle" : "Save bundle"}
          </button>
        </div>

        <aside className="overflow-hidden rounded-md border border-white/[.08] bg-black/20">
          <div className="relative aspect-[4/5]">
            <Image src={assetUrl(bundle?.cover_image)} alt="Bundle cover preview" fill className="object-cover" />
          </div>
          <div className="p-4">
            <span className="eyebrow">Preview</span>
            <strong className="mt-2 block">{bundle?.title || "Your bundle"}</strong>
            <p className="mt-2 text-xs leading-5 text-[#8991a6]">
              Recommended upload: portrait 1200 x 1600. Rakexura converts it to optimized WebP.
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}

