export default function BundlesLoading() {
  return (
    <main className="shell py-8 space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-28 rounded skeleton" />
        <div className="h-8 w-48 rounded skeleton" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-[#0d0b1a]/70 p-5 space-y-4">
            <div className="aspect-[16/9] w-full rounded-xl skeleton" />
            <div className="space-y-2">
              <div className="h-5 w-3/4 rounded skeleton" />
              <div className="h-4 w-1/2 rounded skeleton" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="h-6 w-24 rounded skeleton" />
              <div className="h-10 w-28 rounded-lg skeleton" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
