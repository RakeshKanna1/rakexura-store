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
      <div className="relative z-10 page-shell grid min-h-[calc(100vh-140px)] items-center gap-10 py-10 lg:grid-cols-2">
      <section className="hidden lg:block">
        <Gamepad2 size={42} className="text-[#facc15]" />
        <h1 className="mt-7 max-w-lg text-6xl font-black leading-[1.02]">
          Your games, orders, and rewards in one place.
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-[#a0a8c0]">
          Sign in to sync your wishlist and cart, follow delivery, and open your game library.
        </p>
      </section>

      <section className="mx-auto w-full max-w-md">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
            <ShieldCheck className="text-[#00d68f]" size={22} />
          </div>
          <div>
            <h2 className="m-0 text-2xl font-black text-white tracking-tight">Rakexura Account</h2>
            <p className="m-0 mt-0.5 text-xs text-[#a0a8c0]">Securely powered by Supabase Auth</p>
          </div>
        </div>

        {params.error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-300">{params.error}</p>}
        {params.message && <p className="mb-4 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-300">{params.message}</p>}

        <AuthForm mode="login" next={next} />

        <p className="mt-6 text-center text-sm text-[#a0a8c0]">
          New to Rakexura? <Link href="/register" className="font-bold text-[#facc15] hover:text-[#ffe45c] hover:underline transition-colors ml-1">Create an account</Link>
        </p>
      </section>
    </div>
    </>
  );
}
