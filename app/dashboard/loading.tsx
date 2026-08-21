export default function DashboardLoading() {
  return (
    <main className="shell py-8 space-y-6">
      {/* Profile Header Skeleton */}
      <div className="flex items-center gap-4 p-6 rounded-2xl border border-white/10 bg-[#0d0b1a]/80">
        <div className="h-16 w-16 rounded-full skeleton shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 rounded skeleton" />
          <div className="h-4 w-32 rounded skeleton" />
        </div>
        <div className="h-10 w-28 rounded-lg skeleton" />
      </div>

      {/* Rewards & Stats Skeleton Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-xl border border-white/10 bg-[#0d0b1a]/60 space-y-3">
            <div className="h-4 w-28 rounded skeleton" />
            <div className="h-8 w-36 rounded skeleton" />
            <div className="h-3 w-full rounded skeleton" />
          </div>
        ))}
      </div>

      {/* Tab content placeholder skeleton */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0b1a]/70 p-6 space-y-4">
        <div className="h-6 w-40 rounded skeleton" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl skeleton" />
          ))}
        </div>
      </div>
    </main>
  );
}
