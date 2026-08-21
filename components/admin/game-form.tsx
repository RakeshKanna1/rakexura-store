"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, Gamepad2, Zap, Sparkles } from "lucide-react";
import { saveGame } from "@/app/admin/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import type { Game } from "@/types/store";

import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";

const input = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#8b5cf6]";

export function GameForm({ game, genres }: { game?: Game | null; genres: string[] }) {
  const { setIsDirty, setIsSubmitting, confirmNavigation } = useUnsavedChanges();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    game?.available_platforms ?? []
  );
  const [isSubscription, setIsSubscription] = useState<boolean>(
    Boolean(game?.is_subscription)
  );

  const handlePlatformChange = (platform: string, checked: boolean) => {
    setIsDirty(true);
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    } else {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    }
  };

  const showDuration = isSubscription || selectedPlatforms.some((p) => p === "Xbox" || p === "Nvidia GeForce");

  return (
    <form
      key={game?.id ?? "new"}
      action={async (formData) => {
        setIsSubmitting(true);
        await saveGame(formData);
      }}
      onChange={() => setIsDirty(true)}
      suppressHydrationWarning={true}
      className="premium-panel mt-8 rounded-md p-5 md:p-7"
    >
      <input type="hidden" name="id" value={game?.id ?? ""} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Catalog editor</p>
          <h2 className="mt-2 text-2xl font-black">{game ? `Edit ${game.title}` : "Add a game"}</h2>
          <p className="mt-2 text-sm text-[#8991a6]">Upload optimized artwork, set live platforms and prices, then choose where the game appears.</p>
        </div>
        {game && (
          <Link href="/admin/games" onClick={confirmNavigation} className="btn btn-secondary">
            Cancel edit
          </Link>
        )}
      </div>
      
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">Game title<input name="title" defaultValue={game?.title ?? ""} required minLength={2} suppressHydrationWarning={true} className={input} /></label>
        <label className="text-sm font-bold">Tagline<input name="tagline" defaultValue={game?.tagline ?? ""} suppressHydrationWarning={true} className={input} /></label>
        <label className="text-sm font-bold">Developer<input name="developer" defaultValue={game?.developer ?? ""} suppressHydrationWarning={true} className={input} /></label>
        <label className="text-sm font-bold">Publisher<input name="publisher" defaultValue={game?.publisher ?? ""} suppressHydrationWarning={true} className={input} /></label>
        <label className="text-sm font-bold md:col-span-2">
          Short description
          <textarea
            name="description"
            defaultValue={game?.description ?? ""}
            rows={3}
            className={`${input} h-auto py-3 custom-scrollbar`}
            style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
            onWheel={(e) => { e.stopPropagation(); e.currentTarget.scrollTop += e.deltaY; }}
          />
        </label>
        <label className="text-sm font-bold md:col-span-2">
          Full description
          <textarea
            name="long_description"
            defaultValue={game?.long_description ?? ""}
            rows={6}
            className={`${input} h-auto py-3 custom-scrollbar`}
            style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
            onWheel={(e) => { e.stopPropagation(); e.currentTarget.scrollTop += e.deltaY; }}
          />
        </label>
        
        {/* Product Type Switcher */}
        <div className="md:col-span-2 rounded-md border border-white/10 bg-black/20 p-4">
          <p className="eyebrow text-xs mb-3">Product category type</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setIsSubscription(false);
                setSelectedPlatforms(["Steam", "Offline"]);
              }}
              className={`flex items-center justify-center gap-2.5 h-11 px-4 rounded-md font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                !isSubscription
                  ? "bg-white/10 border-white/40 text-white shadow-sm"
                  : "bg-black/25 border-white/10 text-[#8991a6] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Gamepad2 size={16} className={!isSubscription ? "text-white" : "text-[#8991a6]"} />
              <span>Standard PC Game</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSubscription(true);
                setSelectedPlatforms(["1 Month", "2 Months", "3 Months"]);
              }}
              className={`flex items-center justify-center gap-2.5 h-11 px-4 rounded-md font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                isSubscription
                  ? "bg-white/10 border-white/40 text-white shadow-sm"
                  : "bg-black/25 border-white/10 text-[#8991a6] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Zap size={16} className={isSubscription ? "text-white" : "text-[#8991a6]"} />
              <span>Subscription / Pass (Xbox, Nvidia)</span>
            </button>
          </div>
          {/* Hidden input to ensure form submission includes is_subscription */}
          {isSubscription && <input type="hidden" name="is_subscription" value="on" />}
        </div>

        {isSubscription ? (
          <>
            <div className="md:col-span-2 rounded-md border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap size={16} className="text-white shrink-0" />
                <span>Subscription Duration Pricing (₹ INR)</span>
              </div>
              <p className="text-xs text-[#8991a6] mt-1 mb-4">Set individual prices for each plan duration. Unfilled durations will not be offered to customers.</p>
              <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
                <label className="text-xs font-bold text-white">
                  1 Month Price (₹)
                  <input type="number" min="0" step="1" name="price_1m" defaultValue={String(game?.price_1m ?? game?.xbox_price ?? "")} placeholder="e.g. 199" className={input} />
                </label>
                <label className="text-xs font-bold text-white">
                  2 Months Price (₹)
                  <input type="number" min="0" step="1" name="price_2m" defaultValue={String(game?.price_2m ?? "")} placeholder="e.g. 349" className={input} />
                </label>
                <label className="text-xs font-bold text-white flex flex-col">
                  <span className="flex items-center justify-between">
                    <span>3 Months Price (₹)</span>
                    <span className="inline-flex items-center gap-1 rounded bg-white/10 border border-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <Sparkles size={10} />
                      Best Value
                    </span>
                  </span>
                  <input type="number" min="0" step="1" name="price_3m" defaultValue={String(game?.price_3m ?? "")} placeholder="e.g. 499" className={input} />
                </label>
                <label className="text-xs font-bold text-white">
                  6 Months Price (₹)
                  <input type="number" min="0" step="1" name="price_6m" defaultValue={String(game?.price_6m ?? "")} placeholder="e.g. 899" className={input} />
                </label>
                <label className="text-xs font-bold text-white">
                  12 Months Price (₹)
                  <input type="number" min="0" step="1" name="price_12m" defaultValue={String(game?.price_12m ?? "")} placeholder="e.g. 1599" className={input} />
                </label>
                <label className="text-xs font-bold text-[#8991a6]">
                  Original MRP / Compare Price (₹)
                  <input type="number" min="0" step="1" name="original_price" defaultValue={String(game?.original_price ?? "")} placeholder="e.g. 1199" className={input} />
                </label>
              </div>
            </div>
            <label className="text-sm font-bold capitalize">
              Activation Slots / Accounts
              <input type="number" min="0" step="1" name="activation_slots" defaultValue={String(game?.activation_slots ?? "")} className={input} />
            </label>
            <label className="text-sm font-bold capitalize">
              Featured Sale Price (Fallback)
              <input type="number" min="0" step="1" name="sale_price" defaultValue={String(game?.sale_price ?? "")} className={input} />
            </label>
          </>
        ) : (
          ["original_price", "sale_price", "steam_price", "epic_price", "offline_price", "online_price", "xbox_price", "geforce_price", "activation_slots"].map((field) => (
            <label key={field} className="text-sm font-bold capitalize">
              {field.replaceAll("_", " ")}
              <input 
                type="number" 
                min="0" 
                step="1" 
                name={field} 
                defaultValue={String((game as unknown as Record<string, unknown>)?.[field] ?? "")} 
                className={input} 
              />
            </label>
          ))
        )}

        {showDuration && (
          <label className="text-sm font-bold md:col-span-2">
            Default Plan Label / Note
            <input 
              name="duration" 
              defaultValue={game?.duration ?? ""} 
              placeholder="e.g. 1 Month, 3 Months, Instant Activation, Full Warranty" 
              className={input} 
            />
            <span className="mt-2 block text-xs font-normal text-[#8991a6]">Optional badge or subtitle note for this subscription.</span>
          </label>
        )}

        <label className="text-sm font-bold">Offer end date<input type="datetime-local" name="offer_end_date" defaultValue={game?.offer_end_date ? new Date(game.offer_end_date).toISOString().slice(0, 16) : ""} suppressHydrationWarning={true} className={input} /></label>
        <label className="text-sm font-bold">Release / preorder date & time<input type="datetime-local" name="release_date" defaultValue={game?.release_date ? new Date(game.release_date).toISOString().slice(0, 16) : ""} suppressHydrationWarning={true} className={input} /><span className="mt-2 block text-xs font-normal text-[#8991a6]">A future date & time places this title in Upcoming Games.</span></label>
        <label className="text-sm font-bold md:col-span-2">Trailer URL<input type="url" name="trailer_url" defaultValue={game?.trailer_url ?? ""} placeholder="YouTube link or direct .mp4/.webm URL" suppressHydrationWarning={true} className={input} /><span className="mt-2 block text-xs font-normal text-[#8991a6]">YouTube links play on the game page. A direct MP4 or WebM link can also animate the homepage spotlight.</span></label>
        <label className="text-sm font-bold md:col-span-2">
          Key Features (one per line)
          <textarea
            name="key_features"
            defaultValue={game?.key_features?.join("\n") ?? ""}
            rows={4}
            placeholder="e.g.&#10;Stunning next-gen graphics&#10;Expansive open world sandbox&#10;Cooperative multiplayer campaign"
            className={`${input} h-auto py-3 custom-scrollbar`}
            style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
            onWheel={(e) => { e.stopPropagation(); e.currentTarget.scrollTop += e.deltaY; }}
          />
          <span className="mt-2 block text-xs font-normal text-[#8991a6]">Add distinctive game elements, one per line, to showcase on the game&apos;s details page.</span>
        </label>
        <ImageUploader name="cover_image" label="Cover image" initial={game?.cover_image} type="cover" />
        <ImageUploader name="banner_image" label="Banner image" initial={game?.banner_image} type="banner" />
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-bold">Categories</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <label key={genre} className="flex min-h-10 items-center gap-2 rounded border border-white/10 bg-black/20 px-3 text-xs font-normal cursor-pointer select-none">
              <input type="checkbox" name="genres" value={genre} defaultChecked={game?.genres?.includes(genre)} className="cursor-pointer" />
              {genre}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-bold">Available platforms / Plan Options</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {(isSubscription
            ? ["1 Month", "2 Months", "3 Months", "6 Months", "12 Months", "Xbox", "Nvidia GeForce"]
            : ["Steam", "Epic", "Offline", "Online", "Xbox", "Nvidia GeForce"]
          ).map((platform) => (
            <label key={platform} className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 text-sm cursor-pointer hover:border-white/20 transition-all select-none">
              <input 
                type="checkbox" 
                name="platforms" 
                value={platform} 
                checked={selectedPlatforms.includes(platform)}
                onChange={(e) => handlePlatformChange(platform, e.target.checked)} 
                className="cursor-pointer"
              />
              {platform}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-bold">Offers and store placement</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[["offer_enabled", "Enable timed offer"], ["featured_deal", "Featured deal"], ["show_in_hero", "Homepage Spotlight"], ["show_in_featured", "Gamer's choice"], ["show_in_trending", "Trending"], ["show_in_recommended", "Recommended"], ["preorder", "Pre-order Game"]].map(([field, label]) => (
            <label key={field} className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 text-sm cursor-pointer select-none">
              <input type="checkbox" name={field} defaultChecked={Boolean(game?.[field as keyof Game])} className="cursor-pointer" />
              {label}
            </label>
          ))}
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-[#00d68f]/20 bg-[#00d68f]/5 px-4 text-sm text-[#00d68f] cursor-pointer select-none">
            <input 
              type="checkbox" 
              name="online_activation" 
              defaultChecked={Boolean(game?.online_activation)} 
              className="cursor-pointer"
            />
            Online Activation
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 text-sm text-[#d4af37] cursor-pointer select-none">
            <input 
              type="checkbox" 
              name="is_premium" 
              defaultChecked={Boolean(game?.is_premium)} 
              className="cursor-pointer"
            />
            Premium Game
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-4 text-sm text-red-400 cursor-pointer select-none">
            <input 
              type="checkbox" 
              name="out_of_stock" 
              defaultChecked={Boolean(game?.out_of_stock)} 
              className="cursor-pointer"
            />
            Out of Stock
          </label>
        </div>
      </fieldset>

      <button className="btn btn-primary mt-7 w-full md:w-auto" suppressHydrationWarning={true}><Save size={17} /> {game ? "Update game" : "Add game"}</button>
    </form>
  );
}
