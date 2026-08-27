import Link from "next/link";
import { Gamepad2, Gift, PackageSearch, ShieldCheck, UserCheck, MessageSquare, BellRing, Shield, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,whatsapp,role,avatar_url,created_at,is_reseller")
    .eq("id", user.id)
    .maybeSingle();

  const name = String(profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Player");
  const savedWhatsapp = String(profile?.whatsapp || user.user_metadata?.whatsapp || "");
  const userEmail = String(user.email || "");
  const displayName = String(profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "");
  const role = profile?.role ?? (profile?.is_reseller ? "reseller" : "customer");

  return (
    <div className="page-shell pb-8 pt-1">
      
      {/* Header Bar with Enterprise Typography & Single Unified Telemetry Badge */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-3.5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <p className="eyebrow text-[#b9a4ff] text-xs font-bold tracking-wider uppercase">ACCOUNT MANAGEMENT</p>
            <span className="text-xs text-[#8991a6]">•</span>
            <span className="text-xs text-[#8991a6]">Identity &amp; Security Preferences</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Profile &amp; Preferences
          </h1>
        </div>

        {/* Single Unified Studio-Grade Telemetry Pill */}
        <div className="hidden sm:flex items-center">
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0d0f17]/90 px-3.5 py-1.5 text-xs font-medium text-[#8991a6] shadow-sm backdrop-blur-md">
            <span className="flex items-center gap-1.5 text-white/90">
              <Shield size={13} className="text-[#00d68f]" />
              <span>256-Bit Encrypted</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-[#9ee8ca]">
              <ShieldCheck size={13} className="text-[#00d68f]" />
              <span>Lifetime Warranty</span>
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {params.error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
          <Lock size={14} className="text-red-400 shrink-0" />
          <span>{params.error}</span>
        </div>
      )}
      {params.message && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <UserCheck size={14} className="text-emerald-400 shrink-0" />
          <span>{params.message}</span>
        </div>
      )}

      {/* Zero-Scroll Widescreen 12-Column Desktop Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        
        {/* ================= LEFT COLUMN: Identity & Shortcuts (lg:col-span-4) ================= */}
        <div className="lg:col-span-4 h-full">
          
          <div className="premium-panel rounded-xl border border-white/[0.08] bg-[#0d0f17] p-5 shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute top-0 right-0 h-28 w-28 bg-gradient-to-bl from-[#8b5cf6]/15 to-transparent rounded-bl-full pointer-events-none" />
            
            {/* Identity Details */}
            <div>
              <div className="flex flex-col items-center text-center">
                <AvatarUploader userId={user.id} name={name} avatarUrl={profile?.avatar_url} centered={true} />
                
                <h2 className="mt-3.5 text-xl font-black text-white tracking-tight">{name}</h2>
                <p className="mt-0.5 text-xs text-[#8991a6] font-normal break-all">{userEmail}</p>

                {/* Harmonious High-Level Badges */}
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 px-2.5 py-0.5 text-xs font-bold text-[#b9a4ff] capitalize">
                    <ShieldCheck size={12} /> {role} Tier
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                    <CheckCircle2 size={12} /> Verified Account
                  </span>
                </div>
              </div>

              {/* Direct Navigation Shortcuts with Vibrant Brand Icon Badges */}
              <div className="mt-5 border-t border-white/[0.06] pt-4 space-y-1">
                <p className="text-[10px] font-black tracking-widest text-[#8991a6] uppercase mb-1.5 px-1">QUICK ACCESS</p>
                
                {/* Orders & Active Slots (Purple) */}
                <Link
                  href="/dashboard/orders"
                  className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-[#a0a8c0] hover:bg-white/[0.05] hover:text-white transition duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-[#8b5cf6]/15 text-[#b9a4ff] border border-[#8b5cf6]/25 shrink-0 transition-transform group-hover:scale-105">
                      <PackageSearch size={13} />
                    </span>
                    <span>Orders &amp; Active Slots</span>
                  </span>
                  <ChevronRight size={14} className="text-white/30 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-white" />
                </Link>

                {/* Game Library (Cyan / Blue) */}
                <Link
                  href="/dashboard/library"
                  className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-[#a0a8c0] hover:bg-white/[0.05] hover:text-white transition duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-[#0078f2]/15 text-[#38bdf8] border border-[#0078f2]/25 shrink-0 transition-transform group-hover:scale-105">
                      <Gamepad2 size={13} />
                    </span>
                    <span>Game Library</span>
                  </span>
                  <ChevronRight size={14} className="text-white/30 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-white" />
                </Link>

                {/* Rewards & Loyalty Points (Gold / Yellow) */}
                <Link
                  href="/dashboard/rewards"
                  className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-[#a0a8c0] hover:bg-white/[0.05] hover:text-white transition duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/25 shrink-0 transition-transform group-hover:scale-105">
                      <Gift size={13} />
                    </span>
                    <span>Rewards &amp; Loyalty Points</span>
                  </span>
                  <ChevronRight size={14} className="text-white/30 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-white" />
                </Link>
              </div>
            </div>

            {/* Bottom Integrated Device Session */}
            <div className="mt-4 border-t border-white/[0.06] pt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#8991a6]">Active Device Session</span>
              <LogoutButton />
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: Form & Notifications (lg:col-span-8) ================= */}
        <div className="lg:col-span-8 h-full flex flex-col justify-between gap-4">
          
          {/* Main Account Settings Form Card */}
          <div className="premium-panel rounded-xl border border-white/[0.08] bg-[#0d0f17] p-5 sm:p-6 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3 mb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#8b5cf6]/20 text-[#b9a4ff]">
                <UserCheck size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Account Details &amp; Automated Delivery</h2>
                <p className="text-xs text-[#8991a6]">Manage your public gaming alias and encrypted WhatsApp order dispatch destination.</p>
              </div>
            </div>

            <SettingsForm
              initialDisplayName={displayName}
              initialWhatsapp={savedWhatsapp}
              userEmail={userEmail}
              role={role}
            />
          </div>

          {/* Browser Push Notifications Card */}
          <div className="premium-panel rounded-xl border border-white/[0.08] bg-[#0d0f17] px-5 py-4 shadow-xl">
            <PushNotificationToggle isAdmin={profile?.role === "admin"} compact={true} />
          </div>

        </div>

      </div>
    </div>
  );
}
