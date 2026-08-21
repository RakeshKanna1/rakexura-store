export default function GamesLoading() {
  return (
    <main className="shell py-8 space-y-6">
      {/* Category header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-28 rounded skeleton" />
        <div className="h-8 w-64 rounded skeleton" />
      </div>

      {/* Filter and Sort bar skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-white/5">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-20 rounded-full skeleton" />
          ))}
        </div>
        <div className="h-9 w-36 rounded-lg skeleton" />
      </div>

      {/* 4-column game card grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-white/5 bg-[#0d0b1a]/60 flex flex-col">
            <div className="aspect-[3/4] w-full skeleton" />
            <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded skeleton" />
                <div className="h-4 w-full rounded skeleton" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="h-5 w-16 rounded skeleton" />
                <div className="h-6 w-14 rounded skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
