import { getCustomerProofs } from "@/lib/supabase/queries";
import { ProofsGallery } from "@/components/store/proofs-gallery";
import Link from "next/link";
import { ArrowLeft, Star, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Verified Delivery Proofs | Rakexura",
  description: "Browse verified payment proofs, WhatsApp delivery screenshots, and order receipts from genuine Rakexura customers."
};

export const revalidate = 60;

export default async function ProofsPage() {
  const proofs = await getCustomerProofs(50);

  return (
    <div className="page-shell py-10">
      {/* Back button & Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#8991a6] hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Back to Store</span>
        </Link>
      </div>

      <header className="mb-10 max-w-3xl">
        <p className="eyebrow mb-3">Real customer proof</p>
        <h1 className="mb-4 text-4xl font-black sm:text-6xl text-white tracking-tight">Verified Proofs.</h1>
        <p className="section-copy">
          Real customer purchase screenshots, payment confirmations, and WhatsApp delivery proof cards. All customer personal details and phone numbers are securely hidden before publishing.
        </p>
      </header>

      <ProofsGallery proofs={proofs} />
    </div>
  );
}
