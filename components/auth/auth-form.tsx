"use client";

import { Gamepad2, MailCheck, RefreshCw, ShieldCheck, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

function friendlyAuthError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("provider is not enabled") || value.includes("unsupported provider")) return "This sign-in provider must be enabled in Supabase Authentication first.";
  if (value.includes("invalid login")) return "Email or password is incorrect.";
  if (value.includes("email not confirmed")) return "Confirm your email before signing in. You can resend the email below.";
  if (value.includes("already registered")) return "This email already has an account. Try signing in or use a magic link.";
  if (value.includes("rate limit")) return "Too many attempts. Wait a few minutes and try again.";
  if (value.includes("password")) return "Use a password with at least 8 characters.";
  if (value.includes("otp") || value.includes("token")) return "Invalid or expired verification code. Please check your email and try again.";
  return message;
}

export function AuthForm({ mode, next = "/dashboard" }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  
  // Registration & OTP States
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [notice, setNotice] = useState("");
  const [emailAction, setEmailAction] = useState<"resend" | "magic" | null>(null);

  const redirectTo = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function routeSignedInUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
    const destination = next.startsWith("/") ? next : profile?.role === "admin" ? "/admin" : "/dashboard";
    router.replace(destination === "/dashboard" && profile?.role === "admin" ? "/admin" : destination);
    router.refresh();
  }

  // OTP - Send Code
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return toast.error("Enter a valid email address");
    }

    if (mode === "register" && !displayName.trim()) {
      return toast.error("Enter your Gamer Tag or Display Name");
    }

    setOtpLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: redirectTo(),
        shouldCreateUser: true,
      }
    });

    setOtpLoading(false);
    if (error) return toast.error(friendlyAuthError(error.message));
    
    setOtpSent(true);
    toast.success("Verification code sent to your email. Check your inbox.");
  }

  // OTP - Verify Code & Login
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otpCode.trim();
    if (!code || code.length < 6 || code.length > 8) {
      return toast.error("Enter a valid 6 to 8-digit verification code");
    }

    setOtpLoading(true);
    const supabase = createClient();

    // 1. Try type: "email"
    let { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email"
    });

    // 2. Fallback to magiclink
    if (error) {
      const fallback = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "magiclink"
      });
      data = fallback.data;
      error = fallback.error;
    }

    // 3. Fallback to signup
    if (error) {
      const fallbackSignup = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "signup"
      });
      data = fallbackSignup.data;
      error = fallbackSignup.error;
    }

    // Save Display Name to profile
    if (!error && data?.user && displayName.trim()) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: displayName.trim(),
        full_name: displayName.trim(),
      });
    }

    setOtpLoading(false);
    if (error) return toast.error(friendlyAuthError(error.message));

    toast.success("Email verified! Welcome to Rakexura.");
    await routeSignedInUser();
  }

  async function resend() { 
    if (!email) return toast.error("Enter your email first."); 
    setEmailAction("resend"); 
    const { error } = await createClient().auth.resend({ 
      type: "signup", 
      email, 
      options: { emailRedirectTo: redirectTo() } 
    }); 
    setEmailAction(null); 
    if (error) return toast.error(friendlyAuthError(error.message)); 
    toast.success("Verification email resent. Check inbox and spam."); 
  }

  async function magicLink() { 
    if (!email) return toast.error("Enter your email first."); 
    setEmailAction("magic"); 
    const { error } = await createClient().auth.signInWithOtp({ 
      email, 
      options: { 
        emailRedirectTo: redirectTo(), 
        shouldCreateUser: false 
      } 
    }); 
    setEmailAction(null); 
    if (error) return toast.error(friendlyAuthError(error.message)); 
    setNotice("Magic link sent. Check your email inbox and spam folder."); 
  }

  async function social(provider: "google" | "discord") { 
    const { error } = await createClient().auth.signInWithOAuth({ 
      provider, 
      options: { redirectTo: redirectTo() } 
    }); 
    if (error) toast.error(friendlyAuthError(error.message)); 
  }

  return (
    <div className="space-y-4">
      <div className="glass mx-auto max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#08090c]/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        {mode === "login" ? (
          <div>
            {/* Notice to use Google & Discord exclusively */}
            <div className="mb-6 rounded-md border border-amber-500/20 bg-amber-500/[.03] p-4 text-center">
              <h4 className="text-amber-400 font-bold text-sm flex items-center justify-center gap-1.5 mb-1">
                Sign In Option Notice
              </h4>
              <p className="text-xs text-[#a0a8c0] leading-relaxed">
                Email Password and OTP Verification logins are currently under construction. Please use <strong>Google</strong> or <strong>Discord</strong> below to access your account.
              </p>
            </div>

            {/* Social login buttons displayed prominently */}
            <div className="space-y-3.5">
              <button suppressHydrationWarning type="button" onClick={() => social("google")} className="flex h-12 w-full items-center justify-center gap-3 rounded-md bg-white text-sm font-bold text-[#202124] transition hover:bg-[#f1f3f4] cursor-pointer"><span className="text-base font-black text-[#4285f4]">G</span> Sign In with Google</button>
              <button suppressHydrationWarning type="button" onClick={() => social("discord")} className="flex h-12 w-full items-center justify-center gap-3 rounded-md bg-[#5865f2] text-sm font-bold text-white transition hover:bg-[#4752c4] cursor-pointer"><Gamepad2 size={18} /> Sign In with Discord</button>
              <p className="flex items-center justify-center gap-2 text-[11px] text-[#7f879d] pt-2"><ShieldCheck size={13} /> Secure OAuth. Rakexura never receives your provider password.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 1-Click Social Sign-Up */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button suppressHydrationWarning type="button" onClick={() => social("google")} className="flex h-11 items-center justify-center gap-2.5 rounded-md bg-white text-xs font-bold text-[#202124] transition hover:bg-[#f1f3f4] cursor-pointer"><span className="text-sm font-black text-[#4285f4]">G</span> Google</button>
              <button suppressHydrationWarning type="button" onClick={() => social("discord")} className="flex h-11 items-center justify-center gap-2.5 rounded-md bg-[#5865f2] text-xs font-bold text-white transition hover:bg-[#4752c4] cursor-pointer"><Gamepad2 size={16} /> Discord</button>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#727a90]"><span className="h-px flex-1 bg-white/10" /><span>or register with verified email</span><span className="h-px flex-1 bg-white/10" /></div>

            {/* Email OTP Verification Flow */}
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8991a6] mb-1.5">
                      Display Name / Gamer Tag
                    </label>
                    <input 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. ShadowHunter"
                      autoComplete="name"
                      required
                      className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#facc15] focus:outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8991a6] mb-1.5">
                      Email Address
                    </label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#facc15] focus:outline-none" 
                    />
                    <p className="mt-1 text-[11px] text-[#8991a6]">
                      We will send a 6-digit verification code to prove your email is real.
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={otpLoading} 
                    className="w-full rounded-md bg-[#facc15] hover:bg-[#ffe45c] h-11 font-black text-black text-xs sm:text-sm transition shadow-md shadow-[#facc15]/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {otpLoading ? "Sending Code..." : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#7f879d] pt-1 text-center">
                    <ShieldCheck size={13} className="shrink-0 text-[#00d68f]" />
                    <span>Instant verification. No passwords to forget or reset.</span>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="rounded-md border border-[#facc15]/20 bg-[#facc15]/5 p-3 text-xs text-[#a0a8c0] text-center leading-relaxed">
                    We sent a 6-digit verification code to <strong className="text-white">{email}</strong>. Enter it below to activate your account:
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8991a6] mb-1.5 text-center">
                      Enter 6-Digit Code
                    </label>
                    <input 
                      type="text"
                      maxLength={8}
                      required
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      pattern="[0-9]{6,8}"
                      autoComplete="one-time-code"
                      className="h-12 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-center text-xl font-black tracking-[0.25em] text-white placeholder-zinc-600 transition-colors focus:border-[#facc15] focus:outline-none" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={otpLoading} 
                    className="w-full rounded-md bg-[#facc15] hover:bg-[#ffe45c] h-11 font-black text-black text-xs sm:text-sm transition shadow-md shadow-[#facc15]/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {otpLoading ? "Verifying..." : "Verify & Create Account"}
                  </button>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <button 
                      type="button" 
                      onClick={() => setOtpSent(false)} 
                      className="text-[#8991a6] hover:text-white underline cursor-pointer"
                    >
                      ← Change Email
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSendOtp} 
                      className="text-[#8991a6] hover:text-white underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {notice && (
        <div className="mx-auto max-w-md rounded-md border border-[#00d68f]/20 bg-[#00d68f]/[.06] p-4 space-y-3">
          <div className="flex gap-3">
            <MailCheck className="shrink-0 text-[#70efbb]" />
            <p className="text-sm leading-6 text-[#b8d8cb]">{notice}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-2 border-t border-white/10">
            <button type="button" onClick={resend} disabled={emailAction !== null} className="btn btn-secondary text-xs h-9 cursor-pointer">
              <RefreshCw size={14} className={emailAction === "resend" ? "animate-spin" : ""} /> {emailAction === "resend" ? "Sending..." : "Resend email"}
            </button>
            <button type="button" onClick={magicLink} disabled={emailAction !== null} className="btn btn-secondary text-xs h-9 cursor-pointer">
              <MailCheck size={14} /> {emailAction === "magic" ? "Sending..." : "Use magic link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}