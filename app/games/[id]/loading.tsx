import { Play } from "lucide-react";

export default function GameLoading() {
  return (
    <div className="shell relative pb-24 pt-7 lg:py-7 animate-pulse" id="rakexura-loading-screen">
      {/* Banner Skeleton */}
      <div className="relative min-h-[560px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0f17]/60 flex flex-col justify-end p-7 md:p-14">
        {/* LCP placeholder glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d111c] via-[#141a29] to-[#0d111c] opacity-60" />
        
        <div className="relative z-10 space-y-4 w-full max-w-4xl">
          {/* Tagline category skeleton */}
          <div className="h-4 w-32 rounded bg-white/10" />
          {/* Title skeleton */}
          <div className="h-12 md:h-16 w-3/4 rounded-md bg-white/15" />
          {/* Tagline description skeleton */}
          <div className="h-6 w-1/2 rounded bg-white/10" />
          {/* Tags skeletons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-16 rounded border border-white/10 bg-white/5" />
            ))}
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_390px]">
        {/* Main Content Area (Left) */}
        <div className="space-y-12">
          {/* Description Section */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0d111c]/60 p-6 md:p-8 space-y-4">
            <div className="h-4 w-28 rounded bg-white/10" />
            <div className="h-8 w-48 rounded bg-white/15" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-5/6 rounded bg-white/10" />
              <div className="h-4 w-2/3 rounded bg-white/10" />
            </div>
          </div>

          {/* Media / Trailer Section (16:9 Aspect Ratio) */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-5 w-5 rounded bg-white/10" />
              <div className="h-6 w-44 rounded bg-white/15" />
            </div>
            {/* Aspect Ratio video skeleton */}
            <div className="relative aspect-video overflow-hidden rounded-md border border-white/[0.08] bg-black">
              <div className="absolute inset-0 bg-gradient-to-r from-[#08090c] via-[#11141c] to-[#08090c]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/60">
                  <Play size={24} className="text-white/40 ml-1" />
                </div>
              </div>
            </div>
            {/* Screenshot slider skeletons */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="aspect-video rounded-md border border-white/[0.07] bg-white/5" />
              <div className="aspect-video rounded-md border border-white/[0.07] bg-white/5" />
            </div>
          </section>
        </div>

        {/* Purchase Panel & Details (Right) */}
        <div className="space-y-6">
          {/* Purchase Panel Skeleton */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0f17] p-6 md:p-8 space-y-6">
            {/* Platform Selection */}
            <div className="space-y-3">
              <div className="h-3.5 w-24 rounded bg-white/10" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded border border-white/10 bg-white/5" />
                ))}
              </div>
            </div>

            {/* Price Skeleton */}
            <div className="pt-2 space-y-2">
              <div className="h-8 w-36 rounded-md bg-[#facc15]/20" />
              <div className="h-3 w-48 rounded bg-white/10" />
            </div>

            {/* Platform Feature Flags */}
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded bg-white/10" />
                  <div className="h-4 w-32 rounded bg-white/10" />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3.5 pt-4">
              <div className="h-12 w-full rounded-md bg-[#facc15]/30" />
              <div className="h-12 w-full rounded-md border border-white/10 bg-white/5" />
            </div>
          </div>

          {/* Trust Panel Skeleton */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0f17] p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-white/10 shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-4 w-28 rounded bg-white/15" />
                  <div className="h-3 w-5/6 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
