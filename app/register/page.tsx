import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Gamepad2, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { ChampagneFizz } from "@/components/animations/champagne-fizz";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create an Account" };

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <ChampagneFizz />
      <div className="relative z-10 page-shell grid min-h-[calc(100vh-140px)] items-center gap-12 py-10 lg:grid-cols-2">
        <section className="hidden lg:block space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#facc15]/20 bg-[#facc15]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#facc15]">
            <ShieldCheck size={14} className="text-[#00d68f]" />
            <span>Join Rakexura</span>
          </div>
          <h1 className="max-w-lg text-5xl font-black leading-[1.08] tracking-tight text-white">
            Join the next generation of PC gaming.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-[#a0a8c0]">
            Create your free account to unlock member discounts, track instant keys, and build your permanent library.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-[#8991a6]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">✓</span>
              <span>1-Click registration with Google & Discord</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#8991a6]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">✓</span>
              <span>Free member rewards, giveaways, and cashback points</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#8991a6]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">✓</span>
              <span>Instant order updates directly to your WhatsApp</span>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <AuthForm mode="register" />

          <p className="mt-5 text-center text-xs text-[#8991a6]">
            Already registered? <Link href="/login" className="font-bold text-white underline hover:text-[#facc15] transition-colors ml-1">Sign in</Link>
          </p>
        </section>
      </div>
    </>
  );
}
