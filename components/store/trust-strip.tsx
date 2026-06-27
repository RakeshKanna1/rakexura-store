import { BadgeCheck, Headphones, KeyRound, Zap } from "lucide-react";

const points = [{ icon: BadgeCheck, value: "Verified", label: "payment review" }, { icon: Zap, value: "Fast", label: "assisted delivery" }, { icon: KeyRound, value: "Secure", label: "order tracking" }, { icon: Headphones, value: "Direct", label: "WhatsApp support" }];

export function TrustStrip() {
  return <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[.07] bg-white/[.07] lg:grid-cols-4">{points.map(({ icon: Icon, value, label }) => <article key={value} className="flex items-center gap-4 bg-[#0b0e17] p-5"><Icon className="text-[#facc15]" size={22} /><div><strong className="block text-sm">{value}</strong><span className="text-xs text-[#8790a8]">{label}</span></div></article>)}</section>;
}
