import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return <div className="shell py-14"><div className="mb-8 text-center"><p className="eyebrow mb-3">Join Rakexura</p><h1 className="text-4xl font-bold">Create your account</h1><p className="muted mt-3">One library for every order and reward.</p></div><AuthForm mode="register" /><p className="muted mt-6 text-center text-sm">Already registered? <Link href="/login" className="text-white underline">Sign in</Link></p></div>;
}
