import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { BorderGlow } from "@/components/animations/border-glow";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

export function WhatsAppCommunity() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";
  const message = encodeURIComponent("Hi Rakexura, I would like to join the community for game deals and updates.");
  const channel = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || `https://wa.me/${number}?text=${message}`;
  return (
    <section className="section-space pb-1">
      <BorderGlow
        edgeSensitivity={35}
        glowColor="140 100 50"
        backgroundColor="#08080a"
        borderRadius={12}
        glowRadius={30}
        glowIntensity={1.0}
        colors={['#25d366', '#8b5cf6', '#1e1b4b']}
        className="w-full"
      >
        <div className="flex flex-col justify-between gap-5 p-5 text-white sm:flex-row sm:items-center md:px-7 w-full h-full">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/20">
              <WhatsAppIcon size={22} className="h-[22px] w-[22px] text-[#25d366]" />
            </span>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-white">
                Join our WhatsApp Channel <BadgeCheck size={16} className="text-[#8b5cf6]" />
              </h2>
              <p className="mt-1 text-sm font-medium text-[#9da5b8]">
                Get new deals, game drops, giveaways, and exclusive offers directly on WhatsApp.
              </p>
            </div>
          </div>
          <a
            href={channel}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#25d366] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#07130b] hover:bg-[#55e88a] transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[#25d366]/20 shrink-0"
          >
            <span>Open Official Channel</span> <ArrowUpRight size={15} />
          </a>
        </div>
      </BorderGlow>
    </section>
  );
}
