"use client";

import { Gamepad2, MailCheck, RefreshCw, ShieldCheck, ArrowRight, Eye, EyeOff, Loader2, ChevronLeft, CheckCircle2, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

function friendlyAuthError(err: unknown): string {
  if (!err) return "An unexpected error occurred. Please try again.";
  
  let message = "";
  if (typeof err === "string") {
    message = err;
  } else if (typeof err === "object" && err !== null) {
    const obj = err as Record<string, unknown>;
    message = String(obj.message || obj.error_description || obj.msg || obj.error || "");
    if (!message && Object.keys(obj).length > 0) {
      try {
        message = JSON.stringify(obj);
      } catch {
        message = "";
      }
    }
  }

  if (!message || message === "{}" || message === "[]") {
    return "Unable to send verification email. Please check your SMTP settings in Supabase or try again in a few moments.";
  }

  const value = message.toLowerCase();
  if (value.includes("smtp") || value.includes("confirmation mail") || value.includes("535") || value.includes("501") || value.includes("relay access denied") || value.includes("authentication failed")) {
    return "Could not send verification email via Brevo. Please check that your sender email is verified in your Brevo account.";
  }
  if (value.includes("provider is not enabled") || value.includes("unsupported provider")) return "This sign-in provider must be enabled in Supabase Authentication first.";
  if (value.includes("invalid login")) return "Email or password is incorrect.";
  if (value.includes("email not confirmed")) return "Confirm your email before signing in. You can resend the email below.";
  if (value.includes("already registered") || value.includes("user already exists")) return "This email already has an account. Please sign in instead.";
  if (value.includes("rate limit") || value.includes("too many requests") || value.includes("security purposes")) return "Too many attempts. Please wait a few minutes and try again.";
  if (value.includes("password")) return "Use a password with at least 8 characters.";
  if (value.includes("otp") || value.includes("token")) return "Invalid or expired verification code. Please check your email and try again.";
  return message;
}

export function AuthForm({ mode, next = "/dashboard" }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  
  // Registration & OTP States
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Registration Step 1 - Validate inputs & Send OTP
  async function handleRegisterStep1(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();
    const cleanPhone = whatsapp.replace(/\D/g, "");

    if (!trimmedName) {
      return toast.error("Please enter your Gamer Tag or Display Name");
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return toast.error("Please enter a valid email address");
    }

    if (!trimmedEmail.endsWith("@gmail.com")) {
      return toast.error("Only valid @gmail.com email addresses are supported for verification");
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      return toast.error("Please enter a valid 10-digit WhatsApp number");
    }

    if (password.length < 8) {
      return toast.error("Password must be at least 8 characters long");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match. Please verify your password confirmation.");
    }

    setOtpLoading(true);
    const supabase = createClient();

    // 1. Initiate Supabase signUp with the chosen password, display name, and WhatsApp phone
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: password,
      options: {
        emailRedirectTo: redirectTo(),
        data: {
          display_name: trimmedName,
          full_name: trimmedName,
          whatsapp: cleanPhone,
          phone: cleanPhone,
        }
      }
    });

    if (signUpError) {
      // If user already registered, provide friendly notice
      setOtpLoading(false);
      return toast.error(friendlyAuthError(signUpError));
    }

    // Save WhatsApp number locally
    if (typeof window !== "undefined") {
      localStorage.setItem("guest_whatsapp_phone", cleanPhone);
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: { whatsapp: cleanPhone } }));
    }

    // If auto-confirm is enabled in Supabase and user has active session
    if (signUpData.session) {
      await supabase.from("profiles").upsert({
        id: signUpData.session.user.id,
        display_name: trimmedName,
        full_name: trimmedName,
        whatsapp: cleanPhone,
        phone: cleanPhone,
      }).catch(() => null);
      setOtpLoading(false);
      toast.success("Account created and signed in!");
      await routeSignedInUser();
      return;
    }

    // Also trigger OTP send to guarantee verification code delivery
    await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: redirectTo(),
        shouldCreateUser: true,
      }
    }).catch(() => null);

    setOtpLoading(false);
    setOtpSent(true);
    toast.success("Verification code sent to your email. Check your inbox!");
  }

  // Registration Step 2 - Verify Code & Finalize Account
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otpCode.trim();
    if (!code || code.length < 6 || code.length > 8) {
      return toast.error("Enter the valid 6 to 8-digit verification code");
    }

    setOtpLoading(true);
    const supabase = createClient();

    // 1. Verify OTP code
    let { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email"
    });

    if (error) {
      const fallback = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "signup"
      });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      const fallbackMagic = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "magiclink"
      });
      data = fallbackMagic.data;
      error = fallbackMagic.error;
    }

    if (error) {
      setOtpLoading(false);
      return toast.error(friendlyAuthError(error));
    }

    // 2. Set the user's permanent password & save profile
    if (data?.user) {
      if (password) {
        await supabase.auth.updateUser({ password }).catch(() => null);
      }
      const cleanPhone = whatsapp.replace(/\D/g, "");
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: displayName.trim() || undefined,
        full_name: displayName.trim() || undefined,
        whatsapp: cleanPhone || undefined,
        phone: cleanPhone || undefined,
      }).catch(() => null);
    }

    setOtpLoading(false);
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
    if (error) return toast.error(friendlyAuthError(error)); 
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
    if (error) return toast.error(friendlyAuthError(error)); 
    setNotice("Magic link sent. Check your email inbox and spam folder."); 
  }

  async function social(provider: "google" | "discord") { 
    const { error } = await createClient().auth.signInWithOAuth({ 
      provider, 
      options: { redirectTo: redirectTo() } 
    }); 
    if (error) toast.error(friendlyAuthError(error)); 
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

            <div className="flex items-center gap-3 text-xs text-[#727a90]"><span className="h-px flex-1 bg-white/10" /><span>or create with verified email</span><span className="h-px flex-1 bg-white/10" /></div>

            {/* Email + Password + OTP Verification Flow */}
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleRegisterStep1} className="space-y-3.5">
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
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8991a6] mb-1.5">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <input 
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        autoComplete="tel"
                        className="h-11 w-full rounded-md border border-white/10 bg-black/40 pl-3.5 pr-10 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#25d366] focus:outline-none" 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#25d366] pointer-events-none">
                        <MessageSquare size={16} />
                      </div>
                    </div>
                    <span className="mt-1 block text-[11px] text-[#8991a6]">
                      Used for instant game activation delivery & order tracking.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8991a6] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-md border border-white/10 bg-black/40 pl-3.5 pr-10 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#facc15] focus:outline-none" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8991a6] mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        className={`h-11 w-full rounded-md border bg-black/40 pl-3.5 pr-10 text-sm text-white placeholder-zinc-500 transition-colors focus:outline-none ${
                          confirmPassword && password !== confirmPassword 
                            ? "border-red-500/60 focus:border-red-500" 
                            : confirmPassword && password === confirmPassword
                            ? "border-emerald-500/60 focus:border-emerald-500"
                            : "border-white/10 focus:border-[#facc15]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

                  <p className="text-[11px] text-[#8991a6] pt-0.5">
                    We will send a 6-digit verification code to confirm this email is yours.
                  </p>

                  <button 
                    type="submit" 
                    disabled={otpLoading} 
                    className="w-full rounded-md bg-[#facc15] hover:bg-[#ffe45c] h-11 font-black text-black text-xs sm:text-sm transition shadow-md shadow-[#facc15]/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    {otpLoading ? "Sending Code..." : (
                      <>
                        <span>Continue to Verification</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#7f879d] pt-1 text-center">
                    <ShieldCheck size={13} className="shrink-0 text-[#00d68f]" />
                    <span>256-bit encrypted credentials & instant email verification.</span>
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
                    className="w-full rounded-md bg-[#facc15] hover:bg-[#ffe45c] h-11 font-black text-black text-xs sm:text-sm transition shadow-md shadow-[#facc15]/10 disabled:cursor-wait disabled:bg-[#facc15]/80 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-black" />
                        <span>Verifying Security Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Verify & Complete Registration</span>
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center text-xs pt-2">
                    <button 
                      type="button" 
                      onClick={() => setOtpSent(false)} 
                      disabled={otpLoading}
                      className="text-xs font-semibold text-[#8991a6] hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1 px-1.5 rounded hover:bg-white/5 disabled:opacity-50"
                    >
                      <ChevronLeft size={14} />
                      <span>Change Details</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={handleRegisterStep1} 
                      disabled={otpLoading}
                      className="text-xs font-semibold text-[#8991a6] hover:text-[#facc15] transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-[#facc15]/10 disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={otpLoading ? "animate-spin" : ""} />
                      <span>Resend Code</span>
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