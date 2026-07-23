import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { AvatarUploader } from "@/components/account/avatar-uploader";
import { LogoutButton } from "@/components/account/logout-button";
import { SettingsForm } from "@/components/account/settings-form";
import { PushNotificationToggle } from "@/components/common/push-notification-manager";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name,whatsapp,role,avatar_url").eq("id", user.id).maybeSingle();
  const name = String(profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Player");
  const savedWhatsapp = String(profile?.whatsapp || user.user_metadata?.whatsapp || "");
  const userEmail = String(user.email || "");
  const displayName = String(profile?.display_name || "");

  return <div className="page-shell py-10">
    <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white"><ArrowLeft size={16} /> Dashboard</Link>
    <div className="mx-auto mt-6 max-w-3xl">
      <p className="eyebrow">Account</p><h1 className="mt-3 text-4xl font-black">Profile settings</h1><p className="section-copy">Keep delivery and support details accurate.</p>
      {params.error && <p className="mt-5 rounded-md bg-red-500/10 p-4 text-sm text-red-300">{params.error}</p>}
      {params.message && <p className="mt-5 rounded-md bg-emerald-500/10 p-4 text-sm text-emerald-300">{params.message}</p>}
      <section className="premium-panel mt-7 rounded-lg p-6 sm:p-8"><AvatarUploader userId={user.id} name={name} avatarUrl={profile?.avatar_url} /></section>
      
      <SettingsForm
        initialDisplayName={displayName}
        initialWhatsapp={savedWhatsapp}
        userEmail={userEmail}
        role={profile?.role ?? "customer"}
      />

      <div className="mt-5">
        <PushNotificationToggle isAdmin={profile?.role === "admin"} />
      </div>
      <section className="mt-5 rounded-lg border border-red-400/10 bg-red-500/[.025] p-6"><h2 className="font-black">Session</h2><p className="mt-2 text-sm text-[#8991a6]">Logging out clears this device&apos;s customer cart and account session.</p><div className="mt-4 max-w-48"><LogoutButton /></div></section>
    </div>
  </div>;
}
