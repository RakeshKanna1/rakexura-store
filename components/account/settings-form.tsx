"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRound, Mail, Loader2, Check, Phone, Lock } from "lucide-react";
import { saveAccountSettings } from "@/app/dashboard/settings/actions";

interface SettingsFormProps {
  initialDisplayName: string;
  initialWhatsapp: string;
  userEmail: string;
}

export function SettingsForm({
  initialDisplayName,
  initialWhatsapp,
  userEmail,
}: SettingsFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await saveAccountSettings({ displayName, whatsapp });
      if (!res.success) {
        toast.error(res.error || "Failed to update settings");
        return;
      }

      toast.success(res.message || "Account settings updated successfully.");

      if (res.whatsapp !== undefined) {
        setWhatsapp(res.whatsapp || "");
      }

      if (typeof window !== "undefined") {
        if (res.whatsapp) {
          localStorage.setItem("rakexura_whatsapp_linked", "true");
          localStorage.setItem("guest_whatsapp_phone", res.whatsapp);
        }
        window.dispatchEvent(
          new CustomEvent("profile-updated", {
            detail: { whatsapp: res.whatsapp, display_name: res.displayName },
          })
        );
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4 pt-1">
      <div className="space-y-4">
        {/* 2-Column Responsive Input Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-white/90 mb-1.5">
              <span className="flex items-center gap-1.5">
                <UserRound size={14} className="text-[#b9a4ff]" /> Public Display Name
              </span>
            </label>
            <input
              name="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              placeholder="Enter public gamer tag"
              className="min-h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3.5 text-sm text-white placeholder-white/20 outline-none transition duration-150 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]/30 shadow-inner"
            />
          </div>

          {/* Registered Email */}
          <div>
            <label className="block text-xs font-bold text-white/90 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-[#b9a4ff]" /> Registered Email Address
              </span>
            </label>
            <div className="relative">
              <input
                value={userEmail}
                readOnly
                className="min-h-11 w-full cursor-not-allowed rounded-lg border border-white/[0.06] bg-black/15 px-3.5 text-sm text-[#8991a6] outline-none shadow-inner"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Delivery Phone */}
        <div>
          <label className="block text-xs font-bold text-white/90 mb-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-[#00d68f]" /> WhatsApp Delivery Destination
              </span>
              {whatsapp ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00d68f]">
                  <Check size={13} /> Connected (+{whatsapp})
                </span>
              ) : (
                <span className="text-[11px] text-[#8991a6] font-normal">Optional for instant delivery</span>
              )}
            </div>
          </label>
          <input
            name="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            inputMode="tel"
            placeholder="Include country code (e.g., 919876543210)"
            className="min-h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3.5 text-sm text-white placeholder-white/20 outline-none transition duration-150 focus:border-[#00d68f] focus:ring-1 focus:ring-[#00d68f]/30 shadow-inner"
          />
        </div>
      </div>

      {/* Bottom Bar: Security Note & Studio-Grade Save Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08] mt-auto">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#8991a6]">
          <Lock size={13} className="text-[#00d68f]" />
          <span>Encrypted &amp; synchronized across active sessions</span>
        </span>

        {/* High-End Studio-Grade Save Changes Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-bold tracking-wide text-[#08090d] shadow-[0_2px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-150 hover:bg-[#f4f4f8] hover:shadow-[0_4px_18px_rgba(255,255,255,0.18)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#08090d]" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Check size={14} className="stroke-[2.5] text-[#08090d] transition-transform duration-150 group-hover:scale-110" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
