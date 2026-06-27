import Image from "next/image";
import Link from "next/link";
import { getBundles } from "@/lib/supabase/queries";
import { assetUrl, formatPrice } from "@/lib/utils";

export default async function BundlesPage() {
  const bundles = await getBundles();
  return <div className="page-shell py-10"><p className="eyebrow">Save more together</p><h1 className="mt-4 text-4xl font-black sm:text-6xl">Game bundles</h1><p className="section-copy">Curated collections with one clear bundle price.</p><div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{bundles.map((bundle) => <Link href={`/bundles/${bundle.id}`} key={bundle.id} className="overflow-hidden rounded-md border border-white/[.08] bg-[#101522] transition hover:-translate-y-1 hover:border-white/20"><div className="relative aspect-video"><Image src={assetUrl(bundle.cover_image)} alt="" fill className="object-cover" /></div><div className="p-6"><h2>{bundle.title}</h2><p className="line-clamp-2 text-sm leading-6 text-[#a0a8c0]">{bundle.description}</p><div className="mt-5 flex gap-3"><strong>{formatPrice(bundle.bundle_price)}</strong><s className="text-[#8991a6]">{formatPrice(bundle.original_price)}</s></div></div></Link>)}{!bundles.length && <p className="text-[#a0a8c0]">Active combo deals will appear here when added from admin.</p>}</div></div>;
}
