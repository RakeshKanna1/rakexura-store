import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0d0b1a]/80 p-5 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full bg-white/10" />
          <div className="h-7 w-48 rounded-lg bg-white/15" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/30" />
      </div>

      {/* Main Content Skeleton Cards */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0d0b1a]/80 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="h-10 w-64 rounded-lg bg-white/10" />
          <div className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin text-[#b9a4ff]" />
            <span className="text-xs font-bold text-[#b9a4ff]">Loading data...</span>
          </div>
        </div>

        {/* Table/Grid Rows Skeleton */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between h-14 rounded-lg bg-white/[0.03] border border-white/[0.05] px-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-white/10" />
                <div className="h-4 w-40 rounded bg-white/10" />
              </div>
              <div className="h-4 w-24 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
