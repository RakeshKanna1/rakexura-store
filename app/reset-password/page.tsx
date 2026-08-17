import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ChampagneFizz } from "@/components/animations/champagne-fizz";

export const metadata: Metadata = { title: "Set New Password - Rakexura" };

export default function ResetPasswordPage() {
  return (
    <>
      <ChampagneFizz />
      <div className="relative z-10 page-shell grid min-h-[calc(100vh-140px)] items-center gap-10 py-10 lg:grid-cols-2">
        <section className="hidden lg:block">
          <KeyRound size={42} className="text-[#facc15]" />
          <h1 className="mt-7 max-w-lg text-6xl font-black leading-[1.02]">
            Create a secure new password.
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-8 text-[#a0a8c0]">
            Update your account password to regain instant access to your game orders, activation keys, and loyalty rewards.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <ShieldCheck className="text-[#00d68f]" size={22} />
            </div>
            <div>
              <h2 className="m-0 text-2xl font-black text-white tracking-tight">Rakexura Security</h2>
              <p className="m-0 mt-0.5 text-xs text-[#a0a8c0]">Password Recovery Portal</p>
            </div>
          </div>

          <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8 backdrop-blur-2xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18),0_24px_70px_rgba(0,0,0,0.7)]">
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-80 rounded-full bg-white/[0.04] blur-3xl" />
            <div className="relative space-y-5">
              <ResetPasswordForm />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[#a0a8c0]">
            Remember your password? <Link href="/login" className="font-bold text-[#facc15] hover:text-[#ffe45c] hover:underline transition-colors ml-1">Sign in here</Link>
          </p>
        </section>
      </div>
    </>
  );
}
