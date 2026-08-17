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
      <div className="relative z-10 page-shell grid min-h-[calc(100vh-140px)] items-center gap-10 py-10 lg:grid-cols-2">
        <section className="hidden lg:block">
          <Gamepad2 size={42} className="text-[#facc15]" />
          <h1 className="mt-7 max-w-lg text-6xl font-black leading-[1.02]">
            Join the next generation of PC gaming.
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-8 text-[#a0a8c0]">
            Create your free account to unlock member discounts, track instant keys, and save your wishlist.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <ShieldCheck className="text-[#00d68f]" size={22} />
            </div>
            <div>
              <h2 className="m-0 text-2xl font-black text-white tracking-tight">Create Your Account</h2>
              <p className="m-0 mt-0.5 text-xs text-[#a0a8c0]">Secure instant account setup</p>
            </div>
          </div>

          <AuthForm mode="register" />

          <p className="mt-6 text-center text-sm text-[#a0a8c0]">
            Already registered? <Link href="/login" className="font-bold text-[#facc15] hover:text-[#ffe45c] hover:underline transition-colors ml-1">Sign in</Link>
          </p>
        </section>
      </div>
    </>
  );
}
