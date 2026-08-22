"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Layers, Search, CheckSquare, Square, Clock } from "lucide-react";
import { saveFlashSale, saveBulkFlashSale } from "@/app/admin/actions";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";
import { assetUrl, formatPrice } from "@/lib/utils";

const input = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#facc15]";

type FlashSaleValue = { 
  id: number; 
  game_id: number; 
  sale_price: number; 
  price_2m?: number | null;
  price_3m?: number | null;
  price_6m?: number | null;
  price_12m?: number | null;
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
  duration?: string | null;
  is_subscription?: boolean | null;
  price_1m?: number | null;
  price_2m?: number | null;
  price_3m?: number | null;
  price_6m?: number | null;
  price_12m?: number | null;
};

export function FlashSaleForm({ 
  flashSale, 
  games 
}: { 
  flashSale?: FlashSaleValue | null; 
  games: FullGameInfo[]; 
}) {
  const { setIsDirty, setIsSubmitting, confirmNavigation } = useUnsavedChanges();
  
  // Tab mode: single or bulk
  const [activeTab, setActiveTab] = useState<"single" | "bulk">(flashSale ? "single" : "bulk");
  const [singleGameId, setSingleGameId] = useState<number | string>(flashSale?.game_id ?? (games[0]?.id ?? ""));
  const selectedSingleGame = useMemo(() => games.find((g) => g.id === Number(singleGameId)), [games, singleGameId]);
  
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

  // Filtered games
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

  // Preview price calculator based on current active selling price
  const calculatePreviewPrice = (game: FullGameInfo) => {
    const basePrice = Number(game.sale_price ?? game.original_price ?? 0);
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
    <div className="premium-panel mt-8 rounded-md p-5 md:p-7">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Timed Deals</p>
          <h2 className="mt-2 text-2xl font-black">
            {flashSale ? "Edit flash sale" : activeTab === "bulk" ? "Create multi-game sale" : "Create flash sale"}
          </h2>
        </div>

        {!flashSale ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("bulk")}
              className={`btn text-xs ${activeTab === "bulk" ? "btn-primary" : "btn-secondary"}`}
            >
              <Layers size={14} /> Multi-game bulk sale
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`btn text-xs ${activeTab === "single" ? "btn-primary" : "btn-secondary"}`}
            >
              <Zap size={14} /> Single game
            </button>
          </div>
        ) : (
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col text-sm font-bold">
              <span>Discount Type</span>
              <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
                Choose percentage discount, flat amount off, or fixed price.
              </span>
              <select
                name="discount_type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percentage" | "flat" | "fixed")}
                className={input}
              >
                <option value="percentage">Percentage discount (% OFF)</option>
                <option value="flat">Flat amount discount (Rs. OFF)</option>
                <option value="fixed">Set fixed price (Rs.)</option>
              </select>
            </label>

            <label className="flex flex-col text-sm font-bold">
              <span>
                {discountType === "percentage" ? "Discount Percentage (%)" : discountType === "flat" ? "Discount Amount (Rs.)" : "Fixed Sale Price (Rs.)"}
              </span>
              <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
                {discountType === "percentage" ? "e.g. 20 for 20% discount" : discountType === "flat" ? "e.g. 100 for Rs. 100 off" : "e.g. 199 for Rs. 199 price"}
              </span>
              <input
                name="discount_value"
                type="number"
                min="1"
                max={discountType === "percentage" ? 99 : 99999}
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(Math.max(1, Number(e.target.value)))}
                className={input}
              />
            </label>

            <div className="flex flex-col justify-end">
              <div className="rounded-md border border-white/10 bg-black/20 p-3 text-xs text-[#fbeab8]">
                <strong className="text-white block font-bold">Rule Preview:</strong>
                {discountType === "percentage" && `All selected games will get ${discountValue}% off their original price.`}
                {discountType === "flat" && `All selected games will get Rs. ${discountValue} flat reduction.`}
                {discountType === "fixed" && `All selected games will be priced at Rs. ${discountValue}.`}
              </div>
            </div>
          </div>

          {/* Step 2: Schedule & Presets */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm font-bold">Schedule & Timing</p>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#8991a8] flex items-center gap-1 mr-1">
                  <Clock size={12} /> Presets:
                </span>
                <button
                  type="button"
                  onClick={() => setDurationPreset(24)}
                  className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs hover:border-[#facc15] hover:text-[#facc15] transition-colors"
                >
                  24h
                </button>
                <button
                  type="button"
                  onClick={() => setDurationPreset(48)}
                  className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs hover:border-[#facc15] hover:text-[#facc15] transition-colors"
                >
                  48h
                </button>
                <button
                  type="button"
                  onClick={() => setDurationPreset(72)}
                  className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs hover:border-[#facc15] hover:text-[#facc15] transition-colors"
                >
                  3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDurationPreset(168)}
                  className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs hover:border-[#facc15] hover:text-[#facc15] transition-colors"
                >
                  7 Days
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="flex flex-col text-sm font-bold">
                <span>Starts at</span>
                <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
                  Date and time when the sale will become active.
                </span>
                <input
                  name="starts_at"
                  type="datetime-local"
                  required
                  value={bulkStartsAt}
                  onChange={(e) => setBulkStartsAt(e.target.value)}
                  className={input}
                />
              </label>

              <label className="flex flex-col text-sm font-bold">
                <span>Ends at</span>
                <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
                  Date and time when the sale and countdown will end.
                </span>
                <input
                  name="ends_at"
                  type="datetime-local"
                  required
                  value={bulkEndsAt}
                  onChange={(e) => setBulkEndsAt(e.target.value)}
                  className={input}
                />
              </label>
            </div>
          </div>

          {/* Step 3: Select Games */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Select Games</p>
                <span className="text-[11px] text-[#8991a8]">
                  Selected: <b className="text-white">{selectedGameIds.length}</b> of {games.length} games
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="btn btn-secondary text-xs"
                >
                  <CheckSquare size={13} /> Select all ({filteredGames.length})
                </button>
                {selectedGameIds.length > 0 && (
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="btn btn-secondary text-xs"
                  >
                    <Square size={13} /> Deselect all
                  </button>
                )}
              </div>
            </div>

            {/* Search filter */}
            <div className="relative mt-3">
              <Search size={15} className="absolute left-3 top-3.5 text-[#8991a8]" />
              <input
                type="text"
                placeholder="Search games by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-white/10 bg-black/25 pl-9 pr-3 text-sm text-white placeholder-[#8991a8] outline-none focus:border-[#facc15]"
              />
            </div>

            {/* Game List with Native Wheel Scroll & Lenis Bypass */}
            <div
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              onWheel={(e) => e.stopPropagation()}
              className="mt-4 max-h-[440px] overflow-y-auto overscroll-contain space-y-1.5 pr-1.5 rounded-md border border-white/10 bg-black/25 p-2 custom-scrollbar"
              style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
            >
              {filteredGames.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#8991a8]">No games found matching your search.</p>
              ) : (
                filteredGames.map((game) => {
                  const isSelected = selectedGameIds.includes(game.id);
                  const previewPrice = calculatePreviewPrice(game);
                  const currentPrice = Number(game.sale_price ?? game.original_price ?? 0);
                  const mrpPrice = Number(game.original_price ?? 0);
                  const hasSeparateMrp = mrpPrice > 0 && mrpPrice > currentPrice;

                  return (
                    <div
                      key={game.id}
                      onClick={() => toggleSelectGame(game.id)}
                      className={`flex items-center justify-between gap-3 rounded-md border p-2.5 transition-colors cursor-pointer select-none ${
                        isSelected
                          ? "border-[#facc15]/40 bg-[#facc15]/10"
                          : "border-white/5 bg-black/20 hover:border-white/15 hover:bg-black/35"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          name="game_ids"
                          value={game.id}
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-white/20 bg-black text-[#facc15] cursor-pointer"
                        />
                        <div className="relative h-9 w-7 shrink-0 overflow-hidden rounded bg-black/50 border border-white/10">
                          {game.cover_image && (
                            <Image src={assetUrl(game.cover_image)} alt="" fill className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="truncate text-xs font-bold text-white">{game.title}</p>
                            {game.duration && (
                              <span className="shrink-0 text-[10px] font-bold text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/30 rounded px-1.5 py-0.2">
                                {game.duration}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                            <span className="text-[#8991a8]">Current:</span>
                            <span className="font-semibold text-white">{formatPrice(currentPrice)}</span>
                            {hasSeparateMrp && (
                              <span className="text-[#64748b] text-[10px] line-through">
                                (MRP {formatPrice(mrpPrice)})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isSelected ? (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-xs text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/30 rounded px-1.5 py-0.5">
                              Sale: {formatPrice(previewPrice)}
                            </span>
                            <span className="text-[10px] text-[#8991a8] line-through mt-0.5">
                              {formatPrice(currentPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-white/90">
                            {formatPrice(currentPrice)}
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
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 text-sm cursor-pointer select-none">
              <input type="checkbox" name="active" defaultChecked className="cursor-pointer" />
              <span>Active in flash sale carousel</span>
            </label>

            <label className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 text-sm cursor-pointer select-none">
              <input type="checkbox" name="update_catalog" defaultChecked className="cursor-pointer" />
              <span>Also update catalog price & countdown on game pages</span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={selectedGameIds.length === 0}
              className={`btn btn-primary ${selectedGameIds.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Zap size={17} /> Launch bulk sale ({selectedGameIds.length} games)
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
            <label className="flex flex-col text-sm font-bold sm:col-span-2 lg:col-span-3">
              <span>Game / Subscription</span>
              <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
                Select the game or subscription pass you want to place on flash sale.
              </span>
              <select 
                name="game_id" 
                required 
                value={singleGameId} 
                onChange={(e) => {
                  setSingleGameId(e.target.value);
                  setIsDirty(true);
                }} 
                className={input}
              >
                <option value="" disabled>Select a game or subscription...</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}{g.duration ? ` [${g.duration}]` : ""} — (Current: {formatPrice(g.sale_price ?? g.original_price ?? 0)})
                  </option>
                ))}
              </select>
            </label>

            {selectedSingleGame?.is_subscription ? (
              <div className="sm:col-span-2 lg:col-span-3 rounded-lg border border-amber-500/25 bg-gradient-to-b from-amber-500/10 to-transparent p-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap size={16} className="text-[#facc15]" />
                  <span className="text-sm font-bold text-white">Subscription Duration Flash Pricing (₹ INR)</span>
                </div>
                <p className="text-xs text-[#8991a6] mb-4">
                  Set flash prices only for the durations you want on sale. Any duration left blank will keep its original price!
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <label className="flex flex-col text-xs font-bold">
                    <span>1 Month Flash Price (₹)</span>
                    <span className="text-[10px] font-normal text-[#8991a8] mt-0.5 mb-1">
                      Original: {formatPrice(selectedSingleGame.price_1m ?? selectedSingleGame.sale_price ?? selectedSingleGame.original_price ?? 0)}
                    </span>
                    <input 
                      name="sale_price" 
                      type="number" 
                      min="0" 
                      defaultValue={flashSale?.sale_price ?? ""} 
                      placeholder={`Original (${formatPrice(selectedSingleGame.price_1m ?? selectedSingleGame.sale_price ?? selectedSingleGame.original_price ?? 0)})`} 
                      className={input} 
                    />
                  </label>

                  <label className="flex flex-col text-xs font-bold">
                    <span>2 Months Flash Price (₹)</span>
                    <span className="text-[10px] font-normal text-[#8991a8] mt-0.5 mb-1">
                      Original: {formatPrice(selectedSingleGame.price_2m ?? 0)}
                    </span>
                    <input 
                      name="price_2m" 
                      type="number" 
                      min="0" 
                      defaultValue={flashSale?.price_2m ?? ""} 
                      placeholder={selectedSingleGame.price_2m ? `Original (${formatPrice(selectedSingleGame.price_2m)})` : "Leave empty"} 
                      className={input} 
                    />
                  </label>

                  <label className="flex flex-col text-xs font-bold">
                    <span>3 Months Flash Price (₹)</span>
                    <span className="text-[10px] font-normal text-[#8991a8] mt-0.5 mb-1">
                      Original: {formatPrice(selectedSingleGame.price_3m ?? 0)}
                    </span>
                    <input 
                      name="price_3m" 
                      type="number" 
                      min="0" 
                      defaultValue={flashSale?.price_3m ?? ""} 
                      placeholder={selectedSingleGame.price_3m ? `Original (${formatPrice(selectedSingleGame.price_3m)})` : "Leave empty"} 
                      className={input} 
                    />
                  </label>

                  <label className="flex flex-col text-xs font-bold">
                    <span>6 Months Flash Price (₹)</span>
                    <span className="text-[10px] font-normal text-[#8991a8] mt-0.5 mb-1">
                      Original: {formatPrice(selectedSingleGame.price_6m ?? 0)}
                    </span>
                    <input 
                      name="price_6m" 
                      type="number" 
                      min="0" 
                      defaultValue={flashSale?.price_6m ?? ""} 
                      placeholder={selectedSingleGame.price_6m ? `Original (${formatPrice(selectedSingleGame.price_6m)})` : "Leave empty"} 
                      className={input} 
                    />
                  </label>

                  <label className="flex flex-col text-xs font-bold">
                    <span>12 Months Flash Price (₹)</span>
                    <span className="text-[10px] font-normal text-[#8991a8] mt-0.5 mb-1">
                      Original: {formatPrice(selectedSingleGame.price_12m ?? 0)}
                    </span>
                    <input 
                      name="price_12m" 
                      type="number" 
                      min="0" 
                      defaultValue={flashSale?.price_12m ?? ""} 
                      placeholder={selectedSingleGame.price_12m ? `Original (${formatPrice(selectedSingleGame.price_12m)})` : "Leave empty"} 
                      className={input} 
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col text-sm font-bold">
                <span>Sale Price (Rs.)</span>
                <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
                  The temporary discounted price displayed on the storefront.
                </span>
                <input name="sale_price" type="number" min="0" required defaultValue={flashSale?.sale_price} className={input} />
              </label>
            )}
            
            <label className="flex flex-col text-sm font-bold">
              <span>Starts at</span>
              <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
                Date and time when the sale and countdown will become active.
              </span>
              <input name="starts_at" type="datetime-local" required defaultValue={starts} className={input} />
            </label>
            
            <label className="flex flex-col text-sm font-bold">
              <span>Ends at</span>
              <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
                Date and time when the sale will automatically end.
              </span>
              <input name="ends_at" type="datetime-local" required defaultValue={ends} className={input} />
            </label>

            <label className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 mt-auto text-sm cursor-pointer select-none">
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
