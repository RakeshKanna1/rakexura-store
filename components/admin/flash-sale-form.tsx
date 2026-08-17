"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Layers, Search, CheckSquare, Square, Clock, Sparkles } from "lucide-react";
import { saveFlashSale, saveBulkFlashSale } from "@/app/admin/actions";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";
import { assetUrl, formatPrice } from "@/lib/utils";

const inputStyle = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#facc15] transition-colors";

type FlashSaleValue = { 
  id: number; 
  game_id: number; 
  sale_price: number; 
  starts_at: string; 
  ends_at: string; 
  active: boolean; 
};

type FullGameInfo = {
  id: number;
  title: string;
  original_price?: number | null;
  sale_price?: number | null;
  cover_image?: string | null;
};

export function FlashSaleForm({ 
  flashSale, 
  games 
}: { 
  flashSale?: FlashSaleValue | null; 
  games: FullGameInfo[]; 
}) {
  const { setIsDirty, setIsSubmitting, confirmNavigation } = useUnsavedChanges();
  
  // If editing an existing single flash sale, stay on single mode
  const [activeTab, setActiveTab] = useState<"single" | "bulk">(flashSale ? "single" : "bulk");
  
  // Bulk state
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "flat" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(20);

  // Time calculations
  const nowIso = useMemo(() => new Date(Date.now() + 60000).toISOString().slice(0, 16), []);
  const in3DaysIso = useMemo(() => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), []);

  const [bulkStartsAt, setBulkStartsAt] = useState(nowIso);
  const [bulkEndsAt, setBulkEndsAt] = useState(in3DaysIso);

  const starts = flashSale?.starts_at ? new Date(flashSale.starts_at).toISOString().slice(0, 16) : nowIso;
  const ends = flashSale?.ends_at ? new Date(flashSale.ends_at).toISOString().slice(0, 16) : in3DaysIso;

  // Filtered games for bulk selection
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games;
    const q = searchQuery.toLowerCase();
    return games.filter((g) => g.title.toLowerCase().includes(q));
  }, [games, searchQuery]);

  const toggleSelectGame = (id: number) => {
    setIsDirty(true);
    setSelectedGameIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    setIsDirty(true);
    const filteredIds = filteredGames.map((g) => g.id);
    setSelectedGameIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const deselectAll = () => {
    setIsDirty(true);
    setSelectedGameIds([]);
  };

  const setDurationPreset = (hours: number) => {
    setIsDirty(true);
    const startMs = new Date(bulkStartsAt || Date.now()).getTime();
    const endMs = startMs + hours * 60 * 60 * 1000;
    setBulkEndsAt(new Date(endMs).toISOString().slice(0, 16));
  };

  // Helper to preview discounted price for a game
  const calculatePreviewPrice = (game: FullGameInfo) => {
    const basePrice = Number(game.original_price ?? game.sale_price ?? 0);
    if (basePrice <= 0) return 0;
    if (discountType === "percentage") {
      return Math.max(1, Math.round(basePrice * (1 - discountValue / 100)));
    }
    if (discountType === "flat") {
      return Math.max(1, Math.round(basePrice - discountValue));
    }
    if (discountType === "fixed") {
      return Math.max(1, Math.round(discountValue));
    }
    return basePrice;
  };

  return (
    <div className="premium-panel mt-8 rounded-md p-5 md:p-7 border border-white/10 bg-[#0c0f17]">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="eyebrow flex items-center gap-1.5 text-[#facc15]">
            <Sparkles size={14} /> Flash Sales & Multi-Game Deals
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            {flashSale ? "Edit Flash Sale" : "Create Flash Sale & Bulk Deals"}
          </h2>
        </div>

        {!flashSale && (
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("bulk")}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "bulk"
                  ? "bg-[#facc15] text-black shadow-lg shadow-[#facc15]/20"
                  : "text-[#8991a8] hover:text-white"
              }`}
            >
              <Layers size={14} /> Multi-Game Bulk Sale
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "single"
                  ? "bg-[#facc15] text-black shadow-lg shadow-[#facc15]/20"
                  : "text-[#8991a8] hover:text-white"
              }`}
            >
              <Zap size={14} /> Single Game
            </button>
          </div>
        )}

        {flashSale && (
          <Link href="/admin/flash-sales" onClick={confirmNavigation} className="btn btn-secondary text-xs">
            Cancel edit
          </Link>
        )}
      </div>

      {/* ================= MULTI-GAME BULK SALE FORM ================= */}
      {activeTab === "bulk" && !flashSale && (
        <form
          action={saveBulkFlashSale}
          onChange={() => setIsDirty(true)}
          onSubmit={() => setIsSubmitting(true)}
          className="mt-6 space-y-6"
        >
          {/* Step 1: Discount Settings */}
          <div className="rounded-lg border border-white/[0.08] bg-black/25 p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#facc15] flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#facc15]/20 text-[10px] text-[#facc15]">1</span>
              Configure Discount Rules
            </h3>
            
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col text-sm font-bold text-white">
                <span>Discount Type</span>
                <span className="mt-1 text-[11px] font-normal text-[#8991a8]">
                  How to calculate the sale price for selected games.
                </span>
                <select
                  name="discount_type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "percentage" | "flat" | "fixed")}
                  className={inputStyle}
                >
                  <option value="percentage">Percentage Discount (% OFF)</option>
                  <option value="flat">Flat Amount Discount (Rs. OFF)</option>
                  <option value="fixed">Set Fixed Flat Price (All to Rs. X)</option>
                </select>
              </label>

              <label className="flex flex-col text-sm font-bold text-white">
                <span>
                  {discountType === "percentage" ? "Discount Percentage (%)" : discountType === "flat" ? "Discount Amount (Rs.)" : "Fixed Sale Price (Rs.)"}
                </span>
                <span className="mt-1 text-[11px] font-normal text-[#8991a8]">
                  {discountType === "percentage" ? "e.g. 20 for 20% off" : discountType === "flat" ? "e.g. 100 for Rs. 100 off" : "e.g. 199 for Rs. 199 each"}
                </span>
                <input
                  name="discount_value"
                  type="number"
                  min="1"
                  max={discountType === "percentage" ? 99 : 99999}
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Math.max(1, Number(e.target.value)))}
                  className={inputStyle}
                />
              </label>

              <div className="flex flex-col justify-end">
                <div className="rounded-md border border-[#facc15]/20 bg-[#facc15]/5 p-3 text-xs text-[#fde047]">
                  <strong className="block text-white font-bold">Rule Preview:</strong>
                  {discountType === "percentage" && `All selected games will be discounted by ${discountValue}% off their original price.`}
                  {discountType === "flat" && `All selected games will get Rs. ${discountValue} flat discount.`}
                  {discountType === "fixed" && `All selected games will be priced at Rs. ${discountValue}.`}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Sale Schedule & Quick Presets */}
          <div className="rounded-lg border border-white/[0.08] bg-black/25 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#facc15] flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#facc15]/20 text-[10px] text-[#facc15]">2</span>
                Set Sale Schedule
              </h3>
              
              {/* Duration Presets */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-[#8991a8] flex items-center gap-1 mr-1">
                  <Clock size={12} /> Presets:
                </span>
                <button
                  type="button"
                  onClick={() => setDurationPreset(24)}
                  className="rounded bg-white/5 border border-white/10 px-2 py-1 hover:bg-[#facc15]/20 hover:text-[#facc15] transition-colors"
                >
                  24h
                </button>
                <button
                  type="button"
                  onClick={() => setDurationPreset(48)}
                  className="rounded bg-white/5 border border-white/10 px-2 py-1 hover:bg-[#facc15]/20 hover:text-[#facc15] transition-colors"
                >
                  48h
                </button>
                <button
                  type="button"
                  onClick={() => setDurationPreset(72)}
                  className="rounded bg-white/5 border border-white/10 px-2 py-1 hover:bg-[#facc15]/20 hover:text-[#facc15] transition-colors"
                >
                  3 Days (Weekend)
                </button>
                <button
                  type="button"
                  onClick={() => setDurationPreset(168)}
                  className="rounded bg-white/5 border border-white/10 px-2 py-1 hover:bg-[#facc15]/20 hover:text-[#facc15] transition-colors"
                >
                  7 Days
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col text-sm font-bold text-white">
                <span>Starts at</span>
                <input
                  name="starts_at"
                  type="datetime-local"
                  required
                  value={bulkStartsAt}
                  onChange={(e) => setBulkStartsAt(e.target.value)}
                  className={inputStyle}
                />
              </label>

              <label className="flex flex-col text-sm font-bold text-white">
                <span>Ends at</span>
                <input
                  name="ends_at"
                  type="datetime-local"
                  required
                  value={bulkEndsAt}
                  onChange={(e) => setBulkEndsAt(e.target.value)}
                  className={inputStyle}
                />
              </label>
            </div>
          </div>

          {/* Step 3: Select Games with Live Preview */}
          <div className="rounded-lg border border-white/[0.08] bg-black/25 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#facc15] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#facc15]/20 text-[10px] text-[#facc15]">3</span>
                  Select Games to Put on Sale
                </h3>
                <p className="mt-1 text-xs text-[#8991a8]">
                  Selected: <b className="text-[#facc15] font-black">{selectedGameIds.length}</b> of {games.length} games
                </p>
              </div>

              {/* Select All / Deselect Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
                >
                  <CheckSquare size={13} /> Select All ({filteredGames.length})
                </button>
                {selectedGameIds.length > 0 && (
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-[#8991a8] hover:text-white"
                  >
                    <Square size={13} /> Deselect All
                  </button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mt-4">
              <Search size={15} className="absolute left-3 top-3.5 text-[#8991a8]" />
              <input
                type="text"
                placeholder="Search games by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-white/10 bg-black/40 pl-9 pr-3 text-xs text-white placeholder-[#8991a8] outline-none focus:border-[#facc15]"
              />
            </div>

            {/* Games Grid */}
            <div className="mt-4 max-h-96 overflow-y-auto space-y-2 pr-1 rounded-md border border-white/5 bg-black/20 p-2">
              {filteredGames.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#8991a8]">No games match your search query.</p>
              ) : (
                filteredGames.map((game) => {
                  const isSelected = selectedGameIds.includes(game.id);
                  const previewPrice = calculatePreviewPrice(game);
                  const basePrice = Number(game.original_price ?? game.sale_price ?? 0);

                  return (
                    <div
                      key={game.id}
                      onClick={() => toggleSelectGame(game.id)}
                      className={`flex items-center justify-between gap-3 rounded-md border p-2.5 transition-all cursor-pointer select-none ${
                        isSelected
                          ? "border-[#facc15]/50 bg-[#facc15]/10 shadow-[0_0_12px_rgba(250,204,21,0.08)]"
                          : "border-white/5 bg-black/30 hover:border-white/20 hover:bg-black/50"
                      }`}
                    >
                      {/* Left: Checkbox + Thumbnail + Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          name="game_ids"
                          value={game.id}
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent container click
                          className="h-4 w-4 rounded border-white/20 bg-black text-[#facc15] focus:ring-0 cursor-pointer"
                        />
                        <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded bg-black/50 border border-white/10">
                          {game.cover_image && (
                            <Image src={assetUrl(game.cover_image)} alt="" fill className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white">{game.title}</p>
                          <p className="text-[10px] text-[#8991a8]">
                            Original: {formatPrice(basePrice)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Live Sale Preview */}
                      <div className="text-right shrink-0">
                        {isSelected ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="rounded bg-[#facc15] px-1.5 py-0.5 text-[10px] font-black text-black">
                              Sale: {formatPrice(previewPrice)}
                            </span>
                            <span className="text-[9px] text-[#8991a8] line-through mt-0.5">
                              {formatPrice(basePrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#8991a8]">
                            {formatPrice(basePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/25 px-4 py-2.5 text-xs text-white cursor-pointer select-none">
              <input type="checkbox" name="active" defaultChecked className="cursor-pointer" />
              <span>Active in Flash Sale Ticker & Carousel</span>
            </label>

            <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/25 px-4 py-2.5 text-xs text-white cursor-pointer select-none">
              <input type="checkbox" name="update_catalog" defaultChecked className="cursor-pointer" />
              <span>Also update Store Catalog Price & Countdown on Game Pages</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={selectedGameIds.length === 0}
              className={`btn btn-primary min-h-11 px-6 text-sm font-black ${
                selectedGameIds.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Zap size={16} /> Launch Bulk Sale for {selectedGameIds.length} Games
            </button>
          </div>
        </form>
      )}

      {/* ================= SINGLE GAME FLASH SALE FORM ================= */}
      {(activeTab === "single" || flashSale) && (
        <form
          key={flashSale?.id ?? "single_new"}
          action={saveFlashSale}
          onChange={() => setIsDirty(true)}
          onSubmit={() => setIsSubmitting(true)}
          className="mt-6"
        >
          {flashSale && <input type="hidden" name="id" value={flashSale.id} />}
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col text-sm font-bold text-white">
              <span>Game</span>
              <span className="mt-1 text-[11px] font-normal text-[#8991a8]">
                Select the game you want to place on flash sale.
              </span>
              <select name="game_id" required defaultValue={flashSale?.game_id ?? ""} className={inputStyle}>
                <option value="" disabled>Select a game...</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </label>
            
            <label className="flex flex-col text-sm font-bold text-white">
              <span>Sale Price (Rs.)</span>
              <span className="mt-1 text-[11px] font-normal text-[#8991a8]">
                The temporary discounted price displayed on the storefront.
              </span>
              <input name="sale_price" type="number" min="0" required defaultValue={flashSale?.sale_price} className={inputStyle} />
            </label>
            
            <label className="flex flex-col text-sm font-bold text-white">
              <span>Starts at</span>
              <span className="mt-1 text-[11px] font-normal text-[#8991a8]">
                Date and time when the sale and countdown will become active.
              </span>
              <input name="starts_at" type="datetime-local" required defaultValue={starts} className={inputStyle} />
            </label>
            
            <label className="flex flex-col text-sm font-bold text-white">
              <span>Ends at</span>
              <span className="mt-1 text-[11px] font-normal text-[#8991a8]">
                Date and time when the sale will automatically end.
              </span>
              <input name="ends_at" type="datetime-local" required defaultValue={ends} className={inputStyle} />
            </label>

            <label className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 mt-auto text-sm cursor-pointer select-none text-white">
              <input 
                type="checkbox" 
                name="active" 
                defaultChecked={flashSale ? Boolean(flashSale.active) : true} 
                className="cursor-pointer"
              />
              <span>Active</span>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn btn-primary">
              <Zap size={17} /> {flashSale ? "Save changes" : "Create flash sale"}
            </button>
            {flashSale && (
              <Link href="/admin/flash-sales" className="btn btn-secondary">
                Cancel edit
              </Link>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
