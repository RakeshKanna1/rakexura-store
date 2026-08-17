"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function verifyRecoverySession() {
      const supabase = createClient();
      await supabase.auth.getSession();
      setCheckingSession(false);
    }
    void verifyRecoverySession();
  }, []);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      return toast.error("Password must be at least 8 characters long");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match. Please check confirmation.");
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setLoading(false);
      return toast.error(error.message || "Failed to update password. Please request a new link.");
    }

    setSuccess(true);
    setLoading(false);
    toast.success("Password updated successfully! Welcome back.");
    setTimeout(() => {
      router.replace("/dashboard");
    }, 1200);
  }

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#facc15] border-t-transparent" />
        <p className="mt-3 text-xs text-[#a0a8c0]">Connecting secure recovery session...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-5 text-center py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
          <CheckCircle2 size={28} />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Password Updated!</h3>
          <p className="mt-1 text-xs text-[#a0a8c0]">
            Your new password is active. Redirecting you to your dashboard...
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#facc15] to-[#eab308] h-11 text-sm font-black text-black shadow-[0_0_24px_rgba(250,204,21,0.3)]"
        >
          <span>Go to Dashboard</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b8bfd6] mb-1.5">
          New Password
        </label>
        <div className="relative group">
          <input
            suppressHydrationWarning
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            className="h-10.5 w-full rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 backdrop-blur-md pl-3.5 pr-10 text-xs text-white placeholder-[#727a90] placeholder:text-xs tracking-wider transition-all duration-200 focus:border-white/40 focus:bg-black/80 focus:ring-2 focus:ring-white/10 focus:outline-none"
          />
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#727a90] hover:text-white transition-colors cursor-pointer p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b8bfd6] mb-1.5">
          Confirm New Password
        </label>
        <div className="relative group">
          <input
            suppressHydrationWarning
            type={showConfirmPassword ? "text" : "password"}
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            className={`h-10.5 w-full rounded-xl border bg-black/40 hover:bg-black/60 backdrop-blur-md pl-3.5 pr-10 text-xs text-white placeholder-[#727a90] placeholder:text-xs tracking-wider transition-all duration-200 focus:outline-none ${
              confirmPassword && password !== confirmPassword
                ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:bg-black/80"
                : confirmPassword && password === confirmPassword
                ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-black/80"
                : "border-white/10 focus:border-white/40 focus:bg-black/80 focus:ring-2 focus:ring-white/10"
            }`}
          />
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#727a90] hover:text-white transition-colors cursor-pointer p-1"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <span className="mt-1 block text-[11px] text-red-400 font-medium">
            Passwords do not match
          </span>
        )}
        {confirmPassword && password === confirmPassword && (
          <span className="mt-1 block text-[11px] text-emerald-400 font-medium">
            ✓ Passwords match
          </span>
        )}
      </div>

      <button
        suppressHydrationWarning
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-[#facc15] to-[#eab308] hover:from-[#ffe45c] hover:to-[#facc15] text-black h-11 font-black text-sm tracking-wide transition-all shadow-[0_0_24px_rgba(250,204,21,0.3)] hover:shadow-[0_0_35px_rgba(250,204,21,0.5)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
      >
        {loading ? "Updating Password..." : (
          <>
            <span>Set New Password & Sign In</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#a0a8c0] pt-1 text-center font-medium">
        <ShieldCheck size={13} className="shrink-0 text-[#00d68f]" />
        <span>256-bit encrypted credentials & session security.</span>
      </p>
    </form>
  );
}
