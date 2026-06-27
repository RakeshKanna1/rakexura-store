"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function WhatsAppOnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkUserOnboarding() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsOpen(false);
        return;
      }

      setUserId(user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("whatsapp")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile for onboarding:", error.message);
        return;
      }

      if (!profile || !profile.whatsapp || profile.whatsapp.trim() === "") {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }

    checkUserOnboarding();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        checkUserOnboarding();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const cleanDigits = phone.replace(/\D/g, "");

    if (cleanDigits.length < 10 || cleanDigits.length > 15) {
      toast.error("Please enter a valid WhatsApp phone number (10 to 15 digits).");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ whatsapp: cleanDigits })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      toast.success("WhatsApp number linked successfully!");
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update WhatsApp number");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#8b5cf6]/20 bg-[#0c0a1a] p-6 shadow-2xl md:p-8">
        <h2 className="text-2xl font-black text-white text-center md:text-3xl bg-gradient-to-r from-white to-[#b9a4ff] bg-clip-text text-transparent">
          🚀 Welcome to Rakexura Store!
        </h2>
        <p className="mt-4 text-sm text-[#9ea6b9] text-center leading-relaxed">
          To ensure instant delivery of your game activation details, please link your active WhatsApp number below before continuing to the store.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="whatsapp-phone" className="block text-xs font-bold uppercase tracking-wider text-[#8b5cf6]">
              WhatsApp Number
            </label>
            <input
              id="whatsapp-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +91 98765 43210"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/45 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#8b5cf6] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#00d68f] py-3 font-semibold text-black transition hover:bg-[#00b076] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Complete Onboarding & Start Browsing"}
          </button>
        </form>
      </div>
    </div>
  );
}
