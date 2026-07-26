"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PackagePlus, Search, Check, CheckSquare, Square } from "lucide-react";
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
  const initialSelected = new Set(bundle?.bundle_games?.map((item) => item.game_id) ?? []);
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>([...initialSelected]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleGame = (id: number) => {
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((gId) => gId !== id) : [...prev, id]
    );
  };

  const filteredGames = games.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <form key={bundle?.id ?? "new"} action={saveBundle} className="premium-panel mt-8 rounded-md p-5 md:p-7">
      <input type="hidden" name="id" value={bundle?.id ?? ""} />
      
      {/* Hidden inputs to pass selected game_ids to server action */}
      {selectedGameIds.map((id) => (
        <input key={id} type="hidden" name="game_ids" value={id} />
      ))}

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
              <textarea
                name="description"
                rows={5}
                defaultValue={bundle?.description ?? ""}
                className={`${field} h-auto max-h-48 overflow-y-auto py-3 custom-scrollbar`}
                style={{
                  overscrollBehavior: "contain",
                  WebkitOverflowScrolling: "touch",
                  touchAction: "pan-y"
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                  e.currentTarget.scrollTop += e.deltaY;
                }}
              />
            </label>
          </div>

          <div className="mt-5 max-w-xs">
            <ImageUploader name="cover_image" label="Bundle cover" initial={bundle?.cover_image} type="cover" />
          </div>

          {/* Interactive Game Picker */}
          <fieldset className="mt-6 rounded-lg border border-white/10 bg-[#090c14] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="text-sm font-bold text-white">Included Games</legend>
              <span className="rounded-full bg-[#8b5cf6]/20 px-2.5 py-0.5 text-xs font-bold text-[#a78bfa]">
                {selectedGameIds.length} Selected
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8991a6]">
              Search and click any game to select or deselect.
            </p>

            {/* Search Input */}
            <div className="relative mt-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8991a6]" />
              <input
                type="text"
                placeholder="Search games by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-white/10 bg-black/40 pl-9 pr-3 text-xs outline-none focus:border-[#8b5cf6]"
              />
            </div>

            {/* Mouse-Scrollable Game List */}
            <div
              className="mt-3 max-h-64 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar"
              style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y"
              }}
              onWheel={(e) => {
                e.stopPropagation();
                e.currentTarget.scrollTop += e.deltaY;
              }}
            >
              {filteredGames.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8991a6]">
                  No games found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredGames.map((game) => {
                  const isSelected = selectedGameIds.includes(game.id);
                  return (
                    <div
                      key={game.id}
                      onClick={() => toggleGame(game.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium transition-all ${
                        isSelected
                          ? "border border-[#8b5cf6]/60 bg-[#8b5cf6]/15 text-white shadow-sm"
                          : "border border-white/5 bg-black/20 text-[#a3adc2] hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-[#a78bfa] shrink-0" />
                        ) : (
                          <Square size={16} className="text-[#555e75] shrink-0" />
                        )}
                        <span className={isSelected ? "font-bold text-white" : ""}>
                          {game.title}
                        </span>
                      </div>

                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#8b5cf6]/30 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#c4b5fd]">
                          <Check size={11} /> Selected
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
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
