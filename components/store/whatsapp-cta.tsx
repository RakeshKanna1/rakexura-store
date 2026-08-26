import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

export function WhatsAppCta() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";
  const message = encodeURIComponent("Hi Rakexura, I need help choosing a game.");
  return (
    <section className="section-space">
      <div className="relative overflow-hidden rounded-xl border border-[#facc15]/15 bg-[linear-gradient(115deg,#11131a,#0c0d10)] p-4 sm:p-7 md:p-10">
        <div className="relative flex flex-col items-start justify-between gap-4 sm:gap-7 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#facc15]">
              <ShieldCheck size={15} /> Direct human support
            </span>
            <h2 className="section-title mt-1.5 sm:mt-3 text-base sm:text-2xl font-black">Not sure which edition or platform to choose?</h2>
            <p className="section-copy mt-1 sm:mt-2 text-xs sm:text-sm">Ask before paying. We will help you confirm availability, platform, and delivery steps.</p>
          </div>
          <a
            href={`https://wa.me/${number}?text=${message}`}
            target="_blank"
            rel="noreferrer"
            className="magnetic-button btn w-full sm:w-auto shrink-0 bg-[#facc15] text-black hover:-translate-y-0.5 justify-center min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-bold"
          >
            <WhatsAppIcon size={17} className="h-4 w-4 fill-current" />
            <span>Chat on WhatsApp</span>
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
