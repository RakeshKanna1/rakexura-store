import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AvatarUploader } from "@/components/account/avatar-uploader";
import { LogoutButton } from "@/components/account/logout-button";
import { PushNotificationToggle } from "@/components/common/push-notification-manager";
import { createClient } from "@/lib/supabase/server";
import { updateAccount } from "./actions";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name,whatsapp,role,avatar_url").eq("id", user.id).maybeSingle();
  const name = profile?.display_name || user.user_metadata.full_name || user.email?.split("@")[0] || "Player";

  return <div className="page-shell py-10">
    <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white"><ArrowLeft size={16} /> Dashboard</Link>
    <div className="mx-auto mt-6 max-w-3xl">
      <p className="eyebrow">Account</p><h1 className="mt-3 text-4xl font-black">Profile settings</h1><p className="section-copy">Keep delivery and support details accurate.</p>
      {params.error && <p className="mt-5 rounded-md bg-red-500/10 p-4 text-sm text-red-300">{params.error}</p>}
      {params.message && <p className="mt-5 rounded-md bg-emerald-500/10 p-4 text-sm text-emerald-300">{params.message}</p>}
      <section className="premium-panel mt-7 rounded-lg p-6 sm:p-8"><AvatarUploader userId={user.id} name={name} avatarUrl={profile?.avatar_url} /></section>
      <form action={updateAccount} className="premium-panel mt-5 space-y-5 rounded-lg p-6 sm:p-8">
        <label className="block text-sm font-bold"><span className="flex items-center gap-2"><UserRound size={16} /> Display name</span><input name="display_name" defaultValue={profile?.display_name ?? ""} required minLength={2} className="mt-2 min-h-12 w-full rounded-md border border-white/10 bg-black/20 px-4 outline-none focus:border-[#8b5cf6]" /></label>
        <label className="block text-sm font-bold">
          <span className="flex items-center justify-between">
            <span>WhatsApp number</span>
            {profile?.whatsapp ? (
              <span className="text-xs text-[#00d68f] font-bold font-mono">✓ Linked (+{profile.whatsapp})</span>
            ) : (
              <span className="text-xs text-amber-400 font-bold">⚠️ Not linked yet</span>
            )}
          </span>
          <input
            name="whatsapp"
            defaultValue={profile?.whatsapp ?? ""}
            inputMode="tel"
            placeholder="Enter phone number (e.g., 919876543210)"
            className="mt-2 min-h-12 w-full rounded-md border border-white/10 bg-black/20 px-4 outline-none focus:border-[#8b5cf6]"
          />
        </label>
        <div className="flex items-center gap-2 rounded-md bg-[#00d68f]/[.06] p-4 text-xs text-[#9ee8ca]"><ShieldCheck size={17} /> Account role: {profile?.role ?? "customer"}</div>
        <button className="btn btn-primary w-full sm:w-auto">Save settings</button>
      </form>
      <div className="mt-5">
        <PushNotificationToggle isAdmin={profile?.role === "admin"} />
      </div>
      <section className="mt-5 rounded-lg border border-red-400/10 bg-red-500/[.025] p-6"><h2 className="font-black">Session</h2><p className="mt-2 text-sm text-[#8991a6]">Logging out clears this device&apos;s customer cart and account session.</p><div className="mt-4 max-w-48"><LogoutButton /></div></section>
    </div>
  </div>;
}
