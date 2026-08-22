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
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00d68f]/10 text-[#00d68f] text-xs font-black border border-[#00d68f]/20">
            <ShieldCheck size={14} />
            100% Genuine Deliveries
          </span>
          <Link
            href="/reviews"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[#8991a6] hover:text-white text-xs font-bold border border-white/10 transition"
          >
            <Star size={13} className="text-[#facc15]" />
            Customer Reviews
          </Link>
        </div>
        <h1 className="text-4xl font-black sm:text-6xl text-white tracking-tight">Verified Proofs.</h1>
        <p className="mt-3 section-copy">
          Real customer purchase screenshots, payment confirmations, and WhatsApp delivery proof cards. All customer personal details and phone numbers are securely hidden before publishing.
        </p>
      </header>

      <ProofsGallery proofs={proofs} />
    </div>
  );
}
