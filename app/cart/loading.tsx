export default function CartLoading() {
  return (
    <main className="shell py-8">
      <div className="h-8 w-40 rounded skeleton mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items list skeleton */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-white/10 bg-[#0d0b1a]/60">
              <div className="h-24 w-20 rounded-lg skeleton shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 rounded skeleton" />
                <div className="h-4 w-1/3 rounded skeleton" />
                <div className="h-7 w-28 rounded skeleton" />
              </div>
              <div className="h-6 w-16 rounded skeleton" />
            </div>
          ))}
        </div>

        {/* Order summary card skeleton */}
        <div className="rounded-xl border border-white/10 bg-[#0d0b1a]/80 p-6 space-y-5 h-fit">
          <div className="h-6 w-32 rounded skeleton" />
          <div className="space-y-3 pt-2">
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded skeleton" />
              <div className="h-4 w-16 rounded skeleton" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded skeleton" />
              <div className="h-4 w-16 rounded skeleton" />
            </div>
            <div className="flex justify-between pt-3 border-t border-white/10">
              <div className="h-6 w-20 rounded skeleton" />
              <div className="h-6 w-24 rounded skeleton" />
            </div>
          </div>
          <div className="h-12 w-full rounded-xl skeleton mt-4" />
        </div>
      </div>
    </main>
  );
}
