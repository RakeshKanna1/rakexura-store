const items = [
  ["How does delivery work?", "Create an order after payment. Rakexura verifies it and updates the same tracking timeline until delivery."],
  ["Which platform will I receive?", "Choose from the platforms shown on the game page. Unavailable platforms cannot be added to cart."],
  ["How do I track an order?", "Use the order reference and the WhatsApp number entered at checkout."],
  ["Is my phone number public?", "No. Tracking requires matching private information and never exposes another customer’s details."],
  ["Can I request a game?", "Yes. Sign in and use the Game Request page. Popular requests help prioritize new listings."]
];

import { BackButton } from "@/components/layout/back-button";

export default function FaqPage() {
  return (
    <div className="page-shell py-10">
      <BackButton href="/" label="Back to Store" className="mb-4" />
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow mb-3">Support center</p>
        <h1 className="mb-4 text-4xl font-black sm:text-6xl text-white">Frequently Asked Questions.</h1>
        <p className="section-copy">Clear answers to common questions about payment, delivery, platforms, and game requests.</p>
      </header>
      <div className="max-w-4xl space-y-3">
        {items.map(([q, a]) => (
          <details key={q} className="glass group rounded-xl border border-white/[.07] p-5">
            <summary className="cursor-pointer list-none font-bold text-white transition-colors hover:text-[#facc15]">{q}</summary>
            <p className="mt-3.5 max-w-3xl text-sm leading-relaxed text-[#8991a6]">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
