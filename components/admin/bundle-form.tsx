"use client";

import { useState } from "react";
import Link from "next/link";
import { PackagePlus, Search, Check, CheckSquare, Square } from "lucide-react";
import { saveBundle } from "@/app/admin/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";

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
  const { setIsDirty, setIsSubmitting, confirmNavigation } = useUnsavedChanges();
  const initialSelected = bundle?.bundle_games?.map((item) => item.game_id) ?? [];
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelected);
  const [search, setSearch] = useState("");

  const toggleGame = (id: number) => {
    setIsDirty(true);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredGames = games.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <form
      key={bundle?.id ?? "new"}
      action={saveBundle}
      onChange={() => setIsDirty(true)}
      onSubmit={() => setIsSubmitting(true)}
      className="premium-panel mt-8 rounded-xl border border-white/[.08] bg-[#0c0f18]/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl"
    >
      <input type="hidden" name="id" value={bundle?.id ?? ""} />
      
      {/* Hidden inputs for form submission */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="game_ids" value={id} />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-xs font-bold uppercase tracking-[.14em] text-[#8991a6]">Combo builder</p>
          <h2 className="mt-2 text-2xl font-black text-white">{bundle ? `Edit ${bundle.title}` : "Create a bundle"}</h2>
        </div>
        {bundle && (
          <Link href="/admin/bundles" onClick={confirmNavigation} className="btn btn-secondary border-white/10 hover:border-white/20 text-xs font-bold">
            Cancel edit
          </Link>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-white">
          Bundle title
          <input name="title" required defaultValue={bundle?.title ?? ""} className={field} />
        </label>
        <label className="text-sm font-bold text-white">
          Original total
          <input name="original_price" type="number" min="0" defaultValue={bundle?.original_price ?? ""} className={field} />
        </label>
        <label className="text-sm font-bold text-white">
          Bundle price
          <input name="bundle_price" type="number" min="0" required defaultValue={bundle?.bundle_price ?? ""} className={field} />
        </label>
        <label className="text-sm font-bold text-white">
          Offer end date
          <input
            type="datetime-local"
            name="offer_end_date"
            defaultValue={bundle?.offer_end_date ? new Date(bundle.offer_end_date).toISOString().slice(0, 16) : ""}
            className={field}
          />
        </label>
        <label className="text-sm font-bold text-white sm:col-span-2">
          Description
          <textarea
            name="description"
            rows={4}
            defaultValue={bundle?.description ?? ""}
            className={`${field} h-auto max-h-48 overflow-y-auto py-3 custom-scrollbar`}
          />
        </label>
      </div>

      <div className="mt-5 max-w-sm">
        <ImageUploader name="cover_image" label="Bundle cover" initial={bundle?.cover_image} type="cover" />
      </div>

      {/* Interactive Game Picker */}
      <fieldset className="mt-6 rounded-lg border border-white/10 bg-[#090c14] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-bold text-white">Included Games</legend>
          <span className="rounded-full bg-[#8b5cf6]/20 px-2.5 py-0.5 text-xs font-bold text-[#a78bfa]">
            {selectedIds.length} Selected
          </span>
        </div>
        <p className="mt-1 text-xs text-[#8991a6]">
          Search and click any game to select or deselect.
        </p>

        {/* Selected Games Pill Badges Bar */}
        {selectedIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 rounded-md border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 p-2.5">
            {selectedIds.map((sId) => {
              const g = games.find((item) => item.id === sId);
              if (!g) return null;
              return (
                <span
                  key={sId}
                  onClick={() => toggleGame(sId)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#a78bfa]/40 bg-[#8b5cf6]/25 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-red-500/20 hover:border-red-400/50 cursor-pointer group"
                  title="Click to remove from bundle"
                >
                  <span>{g.title}</span>
                  <span className="text-[#a78bfa] group-hover:text-red-300 font-extrabold text-[11px]">✕</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Search Input */}
        <div className="relative mt-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8991a6]" />
          <input
            type="text"
            placeholder="Search games by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-white/10 bg-black/40 pl-9 pr-3 text-xs text-white outline-none focus:border-[#8b5cf6]"
          />
        </div>

        {/* Scrollable Game List with Lenis Wheel Bypass */}
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
          className="mt-3 max-h-64 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar"
          style={{ touchAction: "pan-y" }}
        >
          {filteredGames.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8991a6]">
              No games found matching &quot;{search}&quot;
            </div>
          ) : (
            filteredGames.map((game) => {
              const isSelected = selectedIds.includes(game.id);
              return (
                <div
                  key={game.id}
                  onClick={() => toggleGame(game.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium transition-all select-none ${
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

      <label className="mt-5 flex min-h-11 items-center gap-2 text-sm font-bold text-white cursor-pointer select-none">
        <input type="checkbox" name="active" defaultChecked={bundle?.active ?? true} />
        Active on storefront
      </label>

      <button 
        type="submit"
        disabled={selectedIds.length < 2}
        className="btn btn-primary mt-6 min-h-11 px-6 text-sm font-bold disabled:opacity-40"
      >
        <PackagePlus size={16} /> 
        <span>{bundle ? "Update bundle" : "Save bundle"}</span>
      </button>
      {selectedIds.length < 2 && (
        <p className="mt-2 text-xs font-semibold text-[#8991a6]">Please select at least 2 games for the combo bundle.</p>
      )}
    </form>
  );
}
