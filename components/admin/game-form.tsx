"use client";

import { useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { saveGame } from "@/app/admin/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import type { Game } from "@/types/store";

const input = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#8b5cf6]";

export function GameForm({ game, genres }: { game?: Game | null; genres: string[] }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    game?.available_platforms ?? ["Steam", "Epic", "Offline"]
  );
  const [isSubscription, setIsSubscription] = useState<boolean>(
    Boolean(game?.is_subscription)
  );

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    } else {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    }
  };

  const showDuration = isSubscription || selectedPlatforms.includes("Xbox") || selectedPlatforms.includes("Nvidia GeForce");

  return (
    <form key={game?.id ?? "new"} action={saveGame} className="premium-panel mt-8 rounded-md p-5 md:p-7">
      <input type="hidden" name="id" value={game?.id ?? ""} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Catalog editor</p>
          <h2 className="mt-2 text-2xl font-black">{game ? `Edit ${game.title}` : "Add a game"}</h2>
          <p className="mt-2 text-sm text-[#8991a6]">Upload optimized artwork, set live platforms and prices, then choose where the game appears.</p>
        </div>
        {game && <Link href="/admin/games" className="btn btn-secondary">Cancel edit</Link>}
      </div>
      
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">Game title<input name="title" defaultValue={game?.title ?? ""} required minLength={2} className={input} /></label>
        <label className="text-sm font-bold">Tagline<input name="tagline" defaultValue={game?.tagline ?? ""} className={input} /></label>
        <label className="text-sm font-bold">Developer<input name="developer" defaultValue={game?.developer ?? ""} className={input} /></label>
        <label className="text-sm font-bold">Publisher<input name="publisher" defaultValue={game?.publisher ?? ""} className={input} /></label>
        <label className="text-sm font-bold md:col-span-2">Short description<textarea name="description" defaultValue={game?.description ?? ""} rows={3} className={`${input} h-auto py-3`} /></label>
        <label className="text-sm font-bold md:col-span-2">Full description<textarea name="long_description" defaultValue={game?.long_description ?? ""} rows={6} className={`${input} h-auto py-3`} /></label>
        
        {["original_price", "sale_price", "steam_price", "epic_price", "offline_price", "online_price", "xbox_price", "geforce_price"].map((field) => (
          <label key={field} className="text-sm font-bold capitalize">
            {field.replaceAll("_", " ")}
            <input 
              type="number" 
              min="0" 
              step="1" 
              name={field} 
              defaultValue={String(game?.[field as keyof Game] ?? "")} 
              className={input} 
            />
          </label>
        ))}

        {showDuration && (
          <label className="text-sm font-bold text-[#facc15] md:col-span-2 animate-fade-in">
            Subscription Duration
            <input 
              name="duration" 
              defaultValue={game?.duration ?? ""} 
              placeholder="e.g. 1 Month, 3 Months, 12 Months, Lifetime" 
              required={showDuration} 
              className={`${input} border-[#facc15]/30 focus:border-[#facc15]`} 
            />
            <span className="mt-2 block text-xs font-normal text-[#8991a6]">Specify the validity duration for this Xbox / GeForce / Custom subscription.</span>
          </label>
        )}

        <label className="text-sm font-bold">Offer end date<input type="datetime-local" name="offer_end_date" defaultValue={game?.offer_end_date ? new Date(game.offer_end_date).toISOString().slice(0, 16) : ""} className={input} /></label>
        <label className="text-sm font-bold">Release / preorder date<input type="date" name="release_date" defaultValue={game?.release_date ? new Date(game.release_date).toISOString().slice(0, 10) : ""} className={input} /><span className="mt-2 block text-xs font-normal text-[#8991a6]">A future date places this title in Upcoming Games.</span></label>
        <label className="text-sm font-bold md:col-span-2">Trailer URL<input type="url" name="trailer_url" defaultValue={game?.trailer_url ?? ""} placeholder="YouTube link or direct .mp4/.webm URL" className={input} /><span className="mt-2 block text-xs font-normal text-[#8991a6]">YouTube links play on the game page. A direct MP4 or WebM link can also animate the homepage spotlight.</span></label>
        <label className="text-sm font-bold md:col-span-2">Key Features (one per line)<textarea name="key_features" defaultValue={game?.key_features?.join("\n") ?? ""} rows={4} placeholder="e.g.&#10;Stunning next-gen graphics&#10;Expansive open world sandbox&#10;Cooperative multiplayer campaign" className={`${input} h-auto py-3`} /><span className="mt-2 block text-xs font-normal text-[#8991a6]">Add distinctive game elements, one per line, to showcase on the game&apos;s details page.</span></label>
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
        <legend className="text-sm font-bold">Available platforms</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {["Steam", "Epic", "Offline", "Online", "Xbox", "Nvidia GeForce"].map((platform) => (
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
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-[#facc15]/20 bg-[#facc15]/5 px-4 text-sm text-[#facc15] cursor-pointer select-none">
            <input 
              type="checkbox" 
              name="is_subscription" 
              checked={isSubscription} 
              onChange={(e) => setIsSubscription(e.target.checked)} 
              className="cursor-pointer"
            />
            Is Subscription / Membership
          </label>
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
          <label className="flex flex-col gap-1 text-sm font-bold md:col-span-2">
            Premium Theme Style
            <select 
              name="premium_theme" 
              defaultValue={game?.premium_theme ?? "royal"} 
              className={`${input} border-[#d4af37]/30 bg-[#16130b] text-[#d4af37] focus:border-[#d4af37]`}
            >
              <option value="royal">👑 Royal Gold (Classic Golden Premium)</option>
              <option value="jungle">🌿 Jungle / Adventure (Emerald & Gold)</option>
              <option value="cyberpunk">⚡ Cyberpunk / Sci-Fi (Neon Cyan & Gold)</option>
              <option value="crimson">🔥 Crimson / Dark Fantasy (Red & Amber)</option>
            </select>
            <span className="text-[11px] font-normal text-[#8991a6]">Choose the page aesthetic theme when this game is set as Premium.</span>
          </label>
        </div>
      </fieldset>

      <button className="btn btn-primary mt-7 w-full md:w-auto"><Save size={17} /> {game ? "Update game" : "Add game"}</button>
    </form>
  );
}
