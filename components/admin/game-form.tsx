"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, Gamepad2, Zap, Sparkles, Check } from "lucide-react";
import { saveGame } from "@/app/admin/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import { PlatformIcon } from "@/components/store/platform-icon";
import type { Game, Platform } from "@/types/store";

import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";

const input = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#8b5cf6]";

export function GameForm({ game, genres }: { game?: Game | null; genres: string[] }) {
  const { setIsDirty, setIsSubmitting, confirmNavigation } = useUnsavedChanges();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(() => {
    const raw = game?.available_platforms ?? [];
    if (!raw.length && !game?.id) {
      return ["Steam (Offline)"];
    }
    const result: string[] = [];
    for (const p of raw) {
      if (p === "Offline" || p === "Online") continue;
      if (p === "Steam") {
        if (Number(game?.offline_price ?? 0) > 0 || raw.includes("Offline" as Platform)) {
          result.push("Steam (Offline)");
        }
        if (game?.online_activation || Number(game?.online_price ?? 0) > 0 || raw.includes("Online" as Platform)) {
          result.push("Steam (Online)");
        }
        if (!result.some((x) => x.startsWith("Steam"))) {
          result.push("Steam (Offline)");
        }
      } else if (p === "Epic") {
        if (Number(game?.offline_price ?? 0) > 0 || raw.includes("Offline" as Platform)) {
          result.push("Epic (Offline)");
        }
        if (game?.online_activation || Number(game?.online_price ?? 0) > 0 || raw.includes("Online" as Platform)) {
          result.push("Epic (Online)");
        }
        if (!result.some((x) => x.startsWith("Epic"))) {
          result.push("Epic (Offline)");
        }
      } else if (p === "Ubisoft") {
        if (Number(game?.offline_price ?? 0) > 0 || raw.includes("Offline" as Platform)) {
          result.push("Ubisoft (Offline)");
        }
        if (game?.online_activation || Number(game?.online_price ?? 0) > 0 || raw.includes("Online" as Platform)) {
          result.push("Ubisoft (Online)");
        }
        if (!result.some((x) => x.startsWith("Ubisoft"))) {
          result.push("Ubisoft (Offline)");
        }
      } else {
        result.push(p);
      }
    }
    return Array.from(new Set(result));
  });
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
        <div className="md:col-span-2 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-black/30 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow text-xs text-[#b9a4ff]">Product category type</p>
            <span className="text-[11px] font-bold text-[#8991a6] hidden sm:inline-block">
              {!isSubscription ? "Standard Catalog Game" : "Recurring Pass / Plan"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setIsSubscription(false);
                setSelectedPlatforms(["Steam (Offline)"]);
              }}
              className={`relative flex items-center justify-between h-12 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer select-none ${
                !isSubscription
                  ? "border-[#8b5cf6] bg-[#8b5cf6]/15 text-white shadow-[0_0_20px_rgba(139,92,246,0.22)] ring-1 ring-[#8b5cf6]/40"
                  : "border-white/10 bg-black/40 text-[#8991a6] hover:border-white/20 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gamepad2 size={18} className={!isSubscription ? "text-[#b9a4ff]" : "text-[#656d81]"} />
                <span>Standard PC Game</span>
              </div>
              {!isSubscription && (
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#b9a4ff]">
                  <span className="h-2 w-2 rounded-full bg-[#b9a4ff] shadow-[0_0_8px_#b9a4ff]" />
                  Active
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSubscription(true);
                setSelectedPlatforms(["1 Month", "2 Months", "3 Months"]);
              }}
              className={`relative flex items-center justify-between h-12 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer select-none ${
                isSubscription
                  ? "border-[#facc15] bg-[#facc15]/15 text-white shadow-[0_0_20px_rgba(250,204,21,0.22)] ring-1 ring-[#facc15]/40"
                  : "border-white/10 bg-black/40 text-[#8991a6] hover:border-white/20 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap size={18} className={isSubscription ? "text-[#facc15]" : "text-[#656d81]"} />
                <span>Subscription / Pass</span>
                <span className="text-[11px] font-normal text-[#8991a6] hidden sm:inline">(Xbox, Nvidia)</span>
              </div>
              {isSubscription && (
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#facc15]">
                  <span className="h-2 w-2 rounded-full bg-[#facc15] shadow-[0_0_8px_#facc15]" />
                  Active
                </span>
              )}
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
            <label className="text-sm font-bold text-white">
              Activation Slots / Accounts
              <input type="number" min="0" step="1" name="activation_slots" defaultValue={String(game?.activation_slots ?? "")} placeholder="Leave blank for Slots available, 0 for Out of slots" className={input} />
              <span className="mt-1 block text-[11px] font-normal text-[#8991a6]">Stock / account slots remaining</span>
            </label>
            <label className="text-sm font-bold text-white">
              Wholesale / Reseller Price (₹)
              <input type="number" min="0" step="1" name="reseller_price" defaultValue={String((game as unknown as Record<string, unknown>)?.reseller_price ?? "")} placeholder="Optional wholesale rate" className={input} />
              <span className="mt-1 block text-[11px] font-normal text-[#8991a6]">Optional discount for reseller accounts</span>
            </label>
          </>
        ) : (
          <>
            {[
              {
                name: "original_price",
                label: "Original MRP / Compare Price (₹)",
                placeholder: "e.g. 2999",
                helper: "Strikethrough base price",
              },
              {
                name: "sale_price",
                label: "Featured Sale Price (₹)",
                placeholder: "e.g. 120",
                helper: "Base catalog / default price",
              },
              {
                name: "offline_price",
                label: "Offline Activation Price (₹)",
                placeholder: "e.g. 120",
                helper: "Applied to Steam, Epic & Ubisoft (Offline)",
              },
              {
                name: "online_price",
                label: "Online Activation Price (₹)",
                placeholder: "e.g. 1499",
                helper: "Applied to Steam, Epic & Ubisoft (Online)",
              },
              {
                name: "xbox_price",
                label: "Xbox PC Price (₹)",
                placeholder: "e.g. 499",
                helper: "Applied if Xbox platform is chosen",
              },
              {
                name: "geforce_price",
                label: "GeForce NOW Price (₹)",
                placeholder: "e.g. 599",
                helper: "Applied if Nvidia GeForce platform is chosen",
              },
              {
                name: "reseller_price",
                label: "Wholesale / Reseller Rate (₹)",
                placeholder: "Optional wholesale rate",
                helper: "Discounted price for resellers",
              },
              {
                name: "activation_slots",
                label: "Activation Slots / Accounts",
                placeholder: "Blank for available, 0 for out",
                helper: "Stock / slot count availability",
              },
            ].map((item) => (
              <label key={item.name} className="text-sm font-bold text-white">
                <span className="flex items-center justify-between">
                  <span>{item.label}</span>
                </span>
                <input 
                  type="number" 
                  min="0" 
                  step="1" 
                  name={item.name} 
                  defaultValue={String((game as unknown as Record<string, unknown>)?.[item.name] ?? "")} 
                  placeholder={item.placeholder}
                  className={input} 
                />
                <span className="mt-1 block text-[11px] font-normal text-[#8991a6]">
                  {item.helper}
                </span>
              </label>
            ))}
          </>
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

      <fieldset className="mt-6 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-black/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-1 mb-3.5">
          <div>
            <legend className="text-sm font-bold text-white flex items-center gap-2">
              <Gamepad2 size={16} className="text-[#b9a4ff]" />
              <span>{isSubscription ? "Available Durations & Passes" : "Available Platforms & Activation"}</span>
            </legend>
            <p className="mt-0.5 text-xs text-[#8991a6]">
              {isSubscription
                ? "Select plan durations supported for this pass"
                : "Choose official launcher and activation delivery modes offered"}
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#b9a4ff] px-2.5 py-0.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
            {selectedPlatforms.length} Selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(isSubscription
            ? ["1 Month", "2 Months", "3 Months", "6 Months", "12 Months", "Xbox", "Nvidia GeForce"]
            : ["Steam (Offline)", "Steam (Online)", "Epic (Offline)", "Epic (Online)", "Ubisoft (Offline)", "Ubisoft (Online)", "Xbox", "Nvidia GeForce"]
          ).map((platform) => {
            const active = selectedPlatforms.includes(platform);
            const isOffline = platform.includes("Offline");
            const isOnline = platform.includes("Online");
            const launcherName = platform.replace(/\s*\((Offline|Online)\)/, "");
            const modeBadge = isOffline ? "Offline" : isOnline ? "Online" : null;

            return (
              <label
                key={platform}
                className={`group relative flex items-center justify-between gap-2.5 min-h-[52px] rounded-xl border px-3 py-2.5 cursor-pointer transition-all duration-200 select-none ${
                  active
                    ? isOffline
                      ? "border-[#facc15]/50 bg-[#facc15]/[0.08] text-white shadow-[0_4px_16px_rgba(250,204,21,0.15)] ring-1 ring-[#facc15]/30"
                      : isOnline
                        ? "border-emerald-500/50 bg-emerald-500/[0.08] text-white shadow-[0_4px_16px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
                        : "border-[#8b5cf6]/50 bg-[#8b5cf6]/[0.08] text-white shadow-[0_4px_16px_rgba(139,92,246,0.15)] ring-1 ring-[#8b5cf6]/30"
                    : "border-white/10 bg-black/40 text-[#8991a6] hover:border-white/20 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <input
                  type="checkbox"
                  name="platforms"
                  value={platform}
                  checked={active}
                  onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                  className="sr-only"
                />

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg border transition-colors shrink-0 ${
                    active
                      ? isOffline
                        ? "border-[#facc15]/40 bg-[#facc15]/20 text-[#facc15]"
                        : isOnline
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                          : "border-[#8b5cf6]/40 bg-[#8b5cf6]/20 text-[#b9a4ff]"
                      : "border-white/10 bg-white/[0.04] text-[#8991a6] group-hover:text-white"
                  }`}>
                    <PlatformIcon platform={platform} className="h-4 w-4 shrink-0" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold leading-tight truncate text-white">
                      {launcherName}
                    </span>
                    {modeBadge ? (
                      <span className={`text-[10px] font-black uppercase tracking-wider leading-tight mt-0.5 ${
                        isOffline
                          ? active ? "text-[#facc15]" : "text-[#facc15]/80"
                          : active ? "text-emerald-400" : "text-emerald-400/80"
                      }`}>
                        {modeBadge}
                      </span>
                    ) : (
                      <span className={`text-[10px] font-medium leading-tight mt-0.5 ${
                        platform === "Xbox"
                          ? "text-[#38bdf8]"
                          : platform.includes("GeForce")
                            ? "text-[#76b900]"
                            : "text-[#6c7487]"
                      }`}>
                        {platform === "Xbox" ? "Console/PC" : platform.includes("GeForce") ? "Cloud" : "Platform"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Checkbox Indicator */}
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                    active
                      ? isOffline
                        ? "border-[#facc15] bg-[#facc15] text-black shadow-[0_0_8px_#facc15]"
                        : isOnline
                          ? "border-emerald-500 bg-emerald-500 text-black shadow-[0_0_8px_#10b981]"
                          : "border-[#8b5cf6] bg-[#8b5cf6] text-white shadow-[0_0_8px_#8b5cf6]"
                      : "border-white/20 bg-black/40 group-hover:border-white/40"
                  }`}
                >
                  {active && <Check size={11} strokeWidth={3.5} />}
                </div>
              </label>
            );
          })}
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
