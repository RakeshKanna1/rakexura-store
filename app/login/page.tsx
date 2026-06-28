import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Gamepad2, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
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

  return <div className="page-shell grid min-h-[calc(100vh-76px)] items-center gap-10 py-12 lg:grid-cols-2"><section className="hidden lg:block"><Gamepad2 size={42} className="text-[#facc15]" /><h1 className="mt-7 max-w-lg text-6xl font-black leading-[1.02]">Your games, orders, and rewards in one place.</h1><p className="max-w-lg text-lg leading-8 text-[#a0a8c0]">Sign in to sync your wishlist and cart, follow delivery, and open your game library.</p></section><section className="mx-auto w-full max-w-lg"><div className="mb-7 flex items-center gap-3"><ShieldCheck className="text-[#00d68f]" /><div><h2 className="m-0 text-2xl">Rakexura account</h2><p className="m-0 mt-1 text-sm text-[#8991a6]">Securely powered by Supabase Auth</p></div></div>{params.error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-300">{params.error}</p>}{params.message && <p className="mb-4 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-300">{params.message}</p>}<AuthForm mode="login" next={next} /><p className="mt-6 text-center text-sm text-[#8991a6]">New to Rakexura? <Link href="/register" className="text-white underline">Create an account</Link></p></section></div>;
}
