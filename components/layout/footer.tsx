"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock3, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function Footer() {
  const [email, setEmail] = useState("");
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";

  async function subscribe(event: FormEvent) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) return toast.error("Enter a valid email");
    const { error } = await createClient().from("newsletter_subscribers").insert({ email: normalized, active: true });
    if (error && error.code !== "23505") return toast.error(error.message);
    toast.success(error?.code === "23505" ? "This email is already subscribed." : "You are subscribed to Rakexura updates.");
    setEmail("");
  }

  return (
    <footer className="mt-20 border-t border-white/[0.06] bg-[#000000] py-16 text-sm text-[#8991a6] md:py-20" aria-label="Global footer">
      <div className="page-shell grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
        {/* Brand Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image src="/Assets/RakeLogo.png" alt="Rakexura" width={44} height={44} className="rounded-md border border-white/10 animate-pulse" />
            <strong className="text-base font-black tracking-widest text-white">RAKEXURA</strong>
          </div>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#8991a6]">
            Premium PC games with clear pricing, secure payment review, and direct human support.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-black tracking-wider">
            <span className="rounded bg-white/[0.03] border border-white/10 px-2.5 py-1 text-white">STEAM</span>
            <span className="rounded bg-white/[0.03] border border-white/10 px-2.5 py-1 text-white">EPIC</span>
            <span className="rounded bg-white/[0.03] border border-white/10 px-2.5 py-1 text-white">OFFLINE</span>
          </div>
        </section>

        {/* Quick Links Section */}
        <nav aria-label="Store links" className="flex flex-col">
          <strong className="text-xs font-black uppercase tracking-widest text-white mb-4">Quick Links</strong>
          <div className="flex flex-col gap-2.5 text-xs">
            <Link href="/games" className="hover:text-white transition-colors duration-200">All games</Link>
            <Link href="/bundles" className="hover:text-white transition-colors duration-200">Bundles</Link>
            <Link href="/subscriptions" className="hover:text-white transition-colors duration-200">Subscriptions</Link>
            <Link href="/wishlist" className="hover:text-white transition-colors duration-200">Wishlist</Link>
            <Link href="/dashboard/library" className="hover:text-white transition-colors duration-200">My games</Link>
            <Link href="/track" className="hover:text-white transition-colors duration-200">Track order</Link>
          </div>
        </nav>

        {/* Support Section */}
        <nav aria-label="Support links" className="flex flex-col">
          <strong className="text-xs font-black uppercase tracking-widest text-white mb-4">Support</strong>
          <div className="flex flex-col gap-2.5 text-xs">
            <Link href="/support" className="hover:text-white transition-colors duration-200">Contact us</Link>
            <Link href="/faq" className="hover:text-white transition-colors duration-200">FAQ</Link>
            <Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms</Link>
            <a href={`https://wa.me/${number}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#70efbb] hover:text-[#52d6a2] transition-colors duration-200 font-semibold">
              <MessageCircle size={14} /> WhatsApp support
            </a>
          </div>
        </nav>

        {/* Newsletter Section */}
        <section className="flex flex-col">
          <strong className="text-xs font-black uppercase tracking-widest text-white mb-4">Stay in the Loop</strong>
          <p className="text-xs leading-relaxed text-[#8991a6] mb-4">
            Occasional new-game and deal updates. No noisy daily mail.
          </p>
          <form onSubmit={subscribe} className="flex gap-2">
            <label htmlFor="footer-email-input" className="group flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded border border-white/10 bg-[#0c0c0c] px-3 focus-within:border-[#facc15] focus-within:shadow-[0_0_12px_rgba(250,204,21,0.15)] transition-all duration-200">
              <Mail size={15} className="text-[#646b7b] group-focus-within:text-[#facc15] transition-colors duration-200" />
              <span className="sr-only">Email address</span>
              <input suppressHydrationWarning id="footer-email-input" name="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="Your email" className="min-w-0 flex-1 bg-transparent pl-1 text-xs text-white outline-none placeholder:text-[#8991a6] placeholder:opacity-80 transition-colors" />
            </label>
            <button suppressHydrationWarning className="rounded bg-[#facc15] px-4 text-xs font-black text-black hover:bg-[#fbbf24] active:scale-[0.96] transition-all">Join</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-black text-[#facc15] tracking-wider">
            <span className="rounded border border-[#facc15]/20 px-2.5 py-1 bg-[#facc15]/5">UPI</span>
            <span className="rounded border border-[#facc15]/20 px-2.5 py-1 bg-[#facc15]/5">GPAY</span>
            <span className="rounded border border-[#facc15]/20 px-2.5 py-1 bg-[#facc15]/5">PHONEPE</span>
          </div>
        </section>
      </div>

      {/* Copyright Footer Bottom */}
      <div className="page-shell mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Rakexura. All rights reserved.</p>
        <div className="flex flex-wrap gap-4 text-[#8991a6]">
          <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-[#facc15]" /> Verified seller</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-white" /> Secure payment</span>
          <span className="flex items-center gap-1.5"><Clock3 size={14} className="text-white" /> Tracked delivery</span>
        </div>
      </div>
    </footer>
  );
}
