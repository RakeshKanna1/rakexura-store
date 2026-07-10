import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BundlePurchaseButton } from "@/components/store/bundle-purchase-button";
import { OfferCountdown } from "@/components/store/offer-countdown";
import { assetUrl, formatPrice } from "@/lib/utils";
import { getBundle, getBundles } from "@/lib/supabase/queries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bundle = await getBundle(Number(id));
  return bundle
    ? {
        title: bundle.title,
        description: bundle.description || "Curated game collection bundle from Rakexura Store.",
        openGraph: {
          images: [assetUrl(bundle.cover_image)],
        },
      }
    : { title: "Bundle not found" };
}

export async function generateStaticParams() {
  const bundles = await getBundles();
  return bundles.map((bundle) => ({
    id: String(bundle.id),
  }));
}

export default async function BundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getBundle(Number(id));
  if (!bundle) notFound();
  
  const titles = bundle.bundle_games?.map((item) => item.games?.title).filter(Boolean) ?? [];
  
  return (
    <div className="shell py-8">
      <section className="grid overflow-hidden rounded-xl border border-white/[.07] bg-[#101522] lg:grid-cols-[55%_1fr]">
        <div className="relative min-h-[420px]">
          <Image src={assetUrl(bundle.cover_image)} alt={bundle.title} fill priority className="object-cover" />
        </div>
        <div className="flex flex-col justify-center p-7 md:p-10">
          <p className="eyebrow">Rakexura combo</p>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">{bundle.title}</h1>
          <p className="muted mt-5 leading-7">{bundle.description}</p>
          
          <div className="mt-6 space-y-2">
            {titles.map((title) => (
              <div key={title} className="rounded-md bg-black/20 px-4 py-3 text-sm">
                {title}
              </div>
            ))}
          </div>

          {bundle.offer_end_date && (
            <div className="mt-6">
              <OfferCountdown end={bundle.offer_end_date} />
            </div>
          )}

          <div className="mt-7 flex items-center gap-3">
            <strong className="text-3xl">{formatPrice(bundle.bundle_price)}</strong>
            {bundle.original_price > bundle.bundle_price && (
              <del className="muted">{formatPrice(bundle.original_price)}</del>
            )}
          </div>
          
          <BundlePurchaseButton bundle={bundle} />
        </div>
      </section>
    </div>
  );
}
