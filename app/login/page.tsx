import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Gamepad2, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { ChampagneFizz } from "@/components/animations/champagne-fizz";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign In" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/dashboard";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect(next);
  }

  return (
    <>
      <ChampagneFizz />
      <div className="relative z-10 page-shell grid min-h-[calc(100vh-140px)] items-center gap-12 py-10 lg:grid-cols-2">
        <section className="hidden lg:block space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#facc15]/20 bg-[#facc15]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#facc15]">
            <ShieldCheck size={14} className="text-[#00d68f]" />
            <span>Official Game Store</span>
          </div>
          <h1 className="max-w-lg text-5xl font-black leading-[1.08] tracking-tight text-white">
            Your games, orders, and rewards in one place.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-[#a0a8c0]">
            Sign in to sync your wishlist, track instant game activations, and access member-only vault discounts.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-[#8991a6]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">✓</span>
              <span>Instant digital license delivery to WhatsApp & Email</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#8991a6]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">✓</span>
              <span>100% Genuine publisher authorized keys</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#8991a6]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">✓</span>
              <span>24/7 dedicated customer support & order tracking</span>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          {params.error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300 text-center">{params.error}</p>}
          {params.message && <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300 text-center">{params.message}</p>}

          <AuthForm mode="login" next={next} />

          <p className="mt-5 text-center text-xs text-[#8991a6]">
            New to Rakexura? <Link href="/register" className="font-bold text-white underline hover:text-[#facc15] transition-colors ml-1">Create an account</Link>
          </p>
        </section>
      </div>
    </>
  );
}
