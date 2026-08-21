export default function WishlistLoading() {
  return (
    <main className="shell py-8 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-44 rounded skeleton" />
        <div className="h-4 w-60 rounded skeleton" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-white/5 bg-[#0d0b1a]/60">
            <div className="aspect-[3/4] w-full skeleton" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 rounded skeleton" />
              <div className="h-5 w-20 rounded skeleton" />
              <div className="h-9 w-full rounded-lg skeleton" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
