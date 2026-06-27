import Link from "next/link";
import { ArrowRight } from "lucide-react";

const questions = [
  ["How does delivery work?", "After payment verification, Rakexura sends delivery details through the contact information on your order."],
  ["Which platforms are supported?", "Each game card shows its currently available Steam, Epic, or Offline options before you add it to cart."],
  ["How do I track my purchase?", "Use your order reference and the same WhatsApp number entered during checkout."],
];

export function FaqPreview() {
  return <section className="section-space"><div className="section-head"><div><p className="eyebrow">Quick answers</p><h2 className="section-title mt-2">Buying from Rakexura</h2></div><Link href="/faq" className="flex items-center gap-2 text-sm font-bold text-[#facc15]">All questions <ArrowRight size={15} /></Link></div><div className="space-y-2">{questions.map(([question, answer]) => <details key={question} className="group rounded-md border border-white/[.08] bg-[#11131a] px-5"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden"><span>{question}</span><span className="text-[#facc15] transition group-open:rotate-45">+</span></summary><p className="max-w-3xl pb-5 text-sm leading-6 text-[#9da4b5]">{answer}</p></details>)}</div></section>;
}
