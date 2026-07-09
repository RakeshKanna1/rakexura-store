import Image from "next/image";
import { DecryptedText } from "@/components/animations/decrypted-text";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#000] overflow-hidden" role="status" aria-label="Loading Rakexura">
      {/* Hyper-fast neon progress line tracking across the very top boundary */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-white/[0.02] overflow-hidden z-[250]">
        <div className="absolute top-0 bottom-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-[#facc15] to-transparent shadow-[0_0_12px_#facc15] animate-loading-neon-progress" />
      </div>

      <div className="text-center relative">
        {/* Glow aura */}
        <div className="absolute -inset-8 rounded-full bg-[#facc15]/10 blur-2xl opacity-60 animate-pulse pointer-events-none" />

        <div className="relative mx-auto h-24 w-24">
          {/* Metallic gold layout frame wrapping the logo */}
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[#facc15]/25 bg-gradient-to-b from-[#1c1917] to-[#0a0a0a] p-4 shadow-[0_0_36px_rgba(250,204,21,0.12)] flex items-center justify-center">
            {/* Golden Shimmer Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_25%,rgba(250,204,21,0.12)_45%,rgba(255,255,255,0.06)_50%,rgba(250,204,21,0.12)_55%,transparent_75%)] -translate-x-full animate-shimmer" />
            
            <Image 
              src="/Assets/RakeLogo.png" 
              alt="Rakexura Logo" 
              width={64} 
              height={64} 
              className="object-contain filter drop-shadow-[0_0_10px_rgba(250,204,21,0.35)]" 
              priority 
            />
          </div>
        </div>

        <strong className="mt-8 block text-lg font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200">
          <DecryptedText text="RAKEXURA" delay={150} speed={40} />
        </strong>
        <p className="mt-2 text-xs tracking-[0.15em] text-[#8f96a8] font-semibold uppercase opacity-75">
          <DecryptedText text="ENTERING PREMIUM MARKETPLACE" delay={450} speed={25} />
        </p>
      </div>
    </div>
  );
}
