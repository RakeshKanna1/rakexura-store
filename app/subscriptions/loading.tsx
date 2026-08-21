export default function SubscriptionsLoading() {
  return (
    <main className="shell py-8 space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded skeleton" />
        <div className="h-8 w-60 rounded skeleton" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-[#0d0b1a]/70 p-6 space-y-5">
            <div className="aspect-[16/9] w-full rounded-xl skeleton" />
            <div className="space-y-2">
              <div className="h-6 w-3/4 rounded skeleton" />
              <div className="h-4 w-full rounded skeleton" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="h-12 rounded-lg skeleton" />
              <div className="h-12 rounded-lg skeleton" />
              <div className="h-12 rounded-lg skeleton" />
            </div>
            <div className="h-12 w-full rounded-xl skeleton mt-4" />
          </div>
        ))}
      </div>
    </main>
  );
}
