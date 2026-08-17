import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Gamepad2, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create an Account" };

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="page-shell grid min-h-[calc(100vh-140px)] items-center gap-10 py-10 lg:grid-cols-2">
      <section className="hidden lg:block">
        <Gamepad2 size={42} className="text-[#facc15]" />
        <h1 className="mt-7 max-w-lg text-6xl font-black leading-[1.02]">
          Join the next generation of PC gaming.
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-[#a0a8c0]">
          Create your free account to unlock member discounts, track instant keys, and save your wishlist.
        </p>
      </section>

      <section className="mx-auto w-full max-w-lg">
        <div className="mb-7 flex items-center gap-3">
          <ShieldCheck className="text-[#00d68f]" />
          <div>
            <h2 className="m-0 text-2xl font-bold">Create your account</h2>
            <p className="m-0 mt-1 text-sm text-[#8991a6]">Secure account setup</p>
          </div>
        </div>

        <AuthForm mode="register" />

        <p className="mt-6 text-center text-sm text-[#8991a6]">
          Already registered? <Link href="/login" className="text-white underline">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
