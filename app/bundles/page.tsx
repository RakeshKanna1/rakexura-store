import Image from "next/image";
import Link from "next/link";
import { getBundles } from "@/lib/supabase/queries";
import { assetUrl, formatPrice } from "@/lib/utils";

export default async function BundlesPage() {
  const bundles = await getBundles();

  return (
    <div className="page-shell py-10 relative overflow-hidden">
      {/* Subtle ambient gaming glows behind content */}
      <div className="absolute -top-40 right-0 -z-10 w-96 h-96 bg-[#facc15]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-0 -z-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <p className="eyebrow">Save more together</p>
      
      <h1 className="mt-4 text-4xl font-black sm:text-6xl text-white">
        Game bundles
      </h1>
      
      <p className="section-copy">
        Curated collections with one clear bundle price.
      </p>
      
      <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {bundles.map((bundle) => (
          <Link 
            href={`/bundles/${bundle.id}`} 
            key={bundle.id} 
            className="overflow-hidden rounded-md border border-white/[.08] bg-[#101522] transition hover:-translate-y-1 hover:border-white/20"
          >
            <div className="relative aspect-video">
              <Image src={assetUrl(bundle.cover_image)} alt="" fill className="object-cover" />
            </div>
            <div className="p-6">
              <h2>{bundle.title}</h2>
              <p className="line-clamp-2 text-sm leading-6 text-[#a0a8c0]">{bundle.description}</p>
              <div className="mt-5 flex gap-3">
                <strong>{formatPrice(bundle.bundle_price)}</strong>
                {bundle.original_price && (
                  <s className="text-[#8991a6]">{formatPrice(bundle.original_price)}</s>
                )}
              </div>
            </div>
          </Link>
        ))}

        {!bundles.length && (
          <>
            {/* Status indicator line */}
            <p className="text-[#a0a8c0] text-sm flex items-center gap-2 col-span-full mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-pulse"></span>
              Active combo deals will appear here when added from admin.
            </p>

            {/* Epic-style dashed layout placeholder slots */}
            {[1, 2, 3].map((slotNum) => (
              <div 
                key={slotNum} 
                className="flex flex-col items-center justify-center aspect-video rounded-md border border-dashed border-white/5 bg-white/[0.01] p-6 text-center select-none"
              >
                <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-neutral-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-600 font-bold mt-3">Slot #{slotNum} Empty</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
