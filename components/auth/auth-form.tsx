"use client";

import { Gamepad2, MailCheck, RefreshCw, ShieldCheck, ArrowRight, Eye, EyeOff, ChevronLeft, MessageSquare, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AnimatedOtpInput } from "./animated-otp-input";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);

  const [notice, setNotice] = useState("");
  const [emailAction, setEmailAction] = useState<"resend" | "magic" | null>(null);

  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginWithOtp, setLoginWithOtp] = useState(false);
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginResolvedEmail, setLoginResolvedEmail] = useState("");
  const [loginOtpCode, setLoginOtpCode] = useState("");
  const [loginOtpLoading, setLoginOtpLoading] = useState(false);
  const [loginOtpError, setLoginOtpError] = useState("");
  const [loginOtpSuccess, setLoginOtpSuccess] = useState(false);

  const redirectTo = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function routeSignedInUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
    const destination = next.startsWith("/") ? next : profile?.role === "admin" ? "/admin" : "/dashboard";
    router.replace(destination === "/dashboard" && profile?.role === "admin" ? "/admin" : destination);
    router.refresh();
  }

  // Sign In Handler (Password)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const identifier = loginEmail.trim();
    if (!identifier) {
      return toast.error("Please enter your email or Gamer Tag");
    }
    if (!loginPassword) {
      return toast.error("Please enter your password");
    }

    setLoginLoading(true);
    const supabase = createClient();
    let targetEmail = identifier;

    // If identifier doesn't have @, look up corresponding email from profiles
    if (!identifier.includes("@")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .or(`display_name.ilike.${identifier},full_name.ilike.${identifier}`)
        .limit(1)
        .maybeSingle();

      if (!profile || !profile.email) {
        setLoginLoading(false);
        return toast.error("No account found with this Gamer Tag. Please check spelling or sign in with your email.");
      }
      targetEmail = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: targetEmail.toLowerCase().trim(),
      password: loginPassword,
    });

    if (error) {
      setLoginLoading(false);
      return toast.error(friendlyAuthError(error));
    }

    setLoginLoading(false);
    toast.success("Welcome back!");
    await routeSignedInUser();
  }

  // Send Login OTP Code
  async function handleSendLoginOtp(e?: React.FormEvent) {
    e?.preventDefault();
    const identifier = loginEmail.trim();
    if (!identifier) {
      return toast.error("Please enter your email or Gamer Tag first");
    }

    setLoginOtpLoading(true);
    setLoginOtpError("");
    const supabase = createClient();
    let targetEmail = identifier;

    if (!identifier.includes("@")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .or(`display_name.ilike.${identifier},full_name.ilike.${identifier}`)
        .limit(1)
        .maybeSingle();

      if (!profile || !profile.email) {
        setLoginOtpLoading(false);
        return toast.error("No account found with this Gamer Tag. Please check spelling or enter your email.");
      }
      targetEmail = profile.email;
    }

    const cleanEmail = targetEmail.toLowerCase().trim();
    setLoginResolvedEmail(cleanEmail);

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectTo(),
        shouldCreateUser: false,
      }
    });

    if (error) {
      setLoginOtpLoading(false);
      return toast.error(friendlyAuthError(error));
    }

    setLoginOtpLoading(false);
    setLoginOtpSent(true);
    toast.success("6-digit sign-in code sent to your email!");
  }

  // Verify Login OTP Code
  async function handleVerifyLoginOtp(codeToVerify?: string) {
    const code = (codeToVerify || loginOtpCode).trim();
    if (!code || code.length < 6) {
      return toast.error("Enter the valid 6-digit verification code");
    }

    setLoginOtpLoading(true);
    setLoginOtpError("");
    const supabase = createClient();

    let { error } = await supabase.auth.verifyOtp({
      email: loginResolvedEmail,
      token: code,
      type: "email"
    });

    if (error) {
      const fallbackMagic = await supabase.auth.verifyOtp({
        email: loginResolvedEmail,
        token: code,
        type: "magiclink"
      });
      error = fallbackMagic.error;
    }

    if (error) {
      setLoginOtpLoading(false);
      const friendlyMsg = friendlyAuthError(error);
      setLoginOtpError(friendlyMsg);
      return toast.error(friendlyMsg);
    }

    setLoginOtpSuccess(true);
    setLoginOtpLoading(false);
    toast.success("Signed in successfully!");
    setTimeout(() => {
      routeSignedInUser();
    }, 700);
  }

  // Registration Step 1 - Validate inputs & Send OTP
  async function handleRegisterStep1(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();
    const cleanPhone = whatsapp.replace(/\D/g, "");

    if (!trimmedName) {
      return toast.error("Please enter your Gamer Tag or Display Name");
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return toast.error("Please enter a valid email address");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return toast.error("Please enter a valid email format");
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
        email: trimmedEmail,
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
  async function handleVerifyOtp(codeToVerify?: string) {
    const code = (codeToVerify || otpCode).trim();
    if (!code || code.length < 6) {
      return toast.error("Enter the valid 6-digit verification code");
    }

    setOtpLoading(true);
    setOtpError("");
    const supabase = createClient();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify OTP code (try signup type first, then email, then magiclink)
    let { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: code,
      type: "signup"
    });

    if (error) {
      const fallback = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: "email"
      });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      const fallbackMagic = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: "magiclink"
      });
      data = fallbackMagic.data;
      error = fallbackMagic.error;
    }

    if (error) {
      setOtpLoading(false);
      const friendlyMsg = friendlyAuthError(error);
      setOtpError(friendlyMsg);
      return toast.error(friendlyMsg);
    }

    setOtpSuccess(true);

    // 2. Set the user's permanent password & save profile
    if (data?.user) {
      if (password) {
        await supabase.auth.updateUser({ password }).catch(() => null);
      }
      const cleanPhone = whatsapp.replace(/\D/g, "");
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: cleanEmail,
        display_name: displayName.trim() || undefined,
        full_name: displayName.trim() || undefined,
        whatsapp: cleanPhone || undefined,
        phone: cleanPhone || undefined,
      }).catch(() => null);
    }

    setOtpLoading(false);
    toast.success("Email verified! Welcome to Rakexura.");
    setTimeout(() => {
      routeSignedInUser();
    }, 700);
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
    <div className="space-y-4" suppressHydrationWarning>
      <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8 backdrop-blur-2xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18),0_24px_70px_rgba(0,0,0,0.7)]" suppressHydrationWarning>
        {/* Subtle glass top highlight */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-80 rounded-full bg-white/[0.04] blur-3xl" />

        {mode === "login" ? (
          <div className="relative space-y-5" suppressHydrationWarning>
            {!loginOtpSent ? (
              <>
                {/* 1-Click Social Sign-In */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => social("google")}
                    className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] hover:border-white/25 backdrop-blur-md text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Google</span>
                  </button>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => social("discord")}
                    className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-[#5865f2]/35 bg-[#5865f2]/15 hover:bg-[#5865f2]/25 hover:border-[#5865f2]/50 backdrop-blur-md text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <Gamepad2 size={16} className="text-[#5865f2]" />
                    <span>Discord</span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center my-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative bg-[#151722]/90 backdrop-blur-md border border-white/10 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#a0a8c0]">
                    or sign in with email
                  </span>
                </div>

                {/* Sign-in Method Tabs */}
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-white/[0.03] backdrop-blur-md p-1 border border-white/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setLoginWithOtp(false)}
                    className={`h-8 rounded-lg transition-all cursor-pointer ${
                      !loginWithOtp 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-[#8991a6] hover:text-white"
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginWithOtp(true)}
                    className={`h-8 rounded-lg transition-all cursor-pointer ${
                      loginWithOtp 
                        ? "bg-white/10 text-[#facc15] shadow-sm" 
                        : "text-[#8991a6] hover:text-[#facc15]"
                    }`}
                  >
                    6-Digit Email OTP
                  </button>
                </div>

                {!loginWithOtp ? (
                  /* Password Sign-In Form */
                  <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b8bfd6] mb-1.5">
                        Email or Gamer Tag
                      </label>
                      <div className="relative group">
                        <input
                          suppressHydrationWarning
                          type="text"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="Enter email or Gamer Tag"
                          autoComplete="username email"
                          className="h-10.5 w-full rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 backdrop-blur-md pl-3.5 pr-10 text-xs text-white placeholder-[#727a90] placeholder:text-xs transition-all duration-200 focus:border-white/40 focus:bg-black/80 focus:ring-2 focus:ring-white/10 focus:outline-none"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#727a90] group-focus-within:text-white transition-colors pointer-events-none">
                          <User size={14} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b8bfd6] mb-1.5">
                        Password
                      </label>
                      <div className="relative group">
                        <input
                          suppressHydrationWarning
                          type={showLoginPassword ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="h-10.5 w-full rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 backdrop-blur-md pl-3.5 pr-10 text-xs text-white placeholder-[#727a90] placeholder:text-xs tracking-wider transition-all duration-200 focus:border-white/40 focus:bg-black/80 focus:ring-2 focus:ring-white/10 focus:outline-none"
                        />
                        <button
                          suppressHydrationWarning
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727a90] hover:text-white transition-colors cursor-pointer p-1"
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        >
                          {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <button
                      suppressHydrationWarning
                      type="submit"
                      disabled={loginLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-[#facc15] to-[#eab308] hover:from-[#ffe45c] hover:to-[#facc15] text-black h-11 font-black text-sm tracking-wide transition-all shadow-[0_0_24px_rgba(250,204,21,0.3)] hover:shadow-[0_0_35px_rgba(250,204,21,0.5)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
                    >
                      {loginLoading ? "Signing In..." : (
                        <>
                          <span>Sign In to Rakexura</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setLoginWithOtp(true)}
                        className="text-[11px] text-[#a0a8c0] hover:text-[#facc15] transition-colors cursor-pointer"
                      >
                        Forgot password? Sign in with OTP
                      </button>
                    </div>

                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#a0a8c0] pt-1 text-center font-medium">
                      <ShieldCheck size={13} className="shrink-0 text-[#00d68f]" />
                      <span>256-bit encrypted credentials & session security.</span>
                    </p>
                  </form>
                ) : (
                  /* 1-Click OTP Sign-In Form */
                  <form onSubmit={handleSendLoginOtp} className="space-y-4" suppressHydrationWarning>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b8bfd6] mb-1.5">
                        Email or Gamer Tag
                      </label>
                      <div className="relative group">
                        <input
                          suppressHydrationWarning
                          type="text"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="Enter email or Gamer Tag"
                          autoComplete="username email"
                          className="h-10.5 w-full rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 backdrop-blur-md pl-3.5 pr-10 text-xs text-white placeholder-[#727a90] placeholder:text-xs transition-all duration-200 focus:border-white/40 focus:bg-black/80 focus:ring-2 focus:ring-white/10 focus:outline-none"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#727a90] group-focus-within:text-white transition-colors pointer-events-none">
                          <User size={14} />
                        </div>
                      </div>
                      <span className="mt-1 block text-[11px] text-[#a0a8c0]">
                        We will send a 6-digit verification code to your email for instant passwordless login.
                      </span>
                    </div>

                    <button
                      suppressHydrationWarning
                      type="submit"
                      disabled={loginOtpLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-[#facc15] to-[#eab308] hover:from-[#ffe45c] hover:to-[#facc15] text-black h-11 font-black text-sm tracking-wide transition-all shadow-[0_0_24px_rgba(250,204,21,0.3)] hover:shadow-[0_0_35px_rgba(250,204,21,0.5)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
                    >
                      {loginOtpLoading ? "Sending Code..." : (
                        <>
                          <span>Send 6-Digit Login Code</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>

                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#a0a8c0] pt-1 text-center font-medium">
                      <ShieldCheck size={13} className="shrink-0 text-[#00d68f]" />
                      <span>Instant 1-time verification via your email inbox.</span>
                    </p>
                  </form>
                )}
              </>
            ) : (
              /* Animated OTP Input Screen for Login */
              <div className="space-y-5">
                <AnimatedOtpInput
                  length={6}
                  email={loginResolvedEmail || loginEmail}
                  name={loginEmail}
                  isLoading={loginOtpLoading}
                  isError={Boolean(loginOtpError)}
                  isSuccess={loginOtpSuccess}
                  errorMessage={loginOtpError}
                  onCodeChange={(code) => {
                    setLoginOtpCode(code);
                    if (loginOtpError) setLoginOtpError("");
                  }}
                  onComplete={(code) => handleVerifyLoginOtp(code)}
                />

                <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginOtpSent(false);
                      setLoginOtpError("");
                      setLoginOtpSuccess(false);
                    }} 
                    disabled={loginOtpLoading}
                    className="text-xs font-semibold text-[#8991a6] hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1 px-1.5 rounded hover:bg-white/5 disabled:opacity-50"
                  >
                    <ChevronLeft size={14} />
                    <span>Back to Login</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginOtpError("");
                      setLoginOtpSuccess(false);
                      handleSendLoginOtp();
                    }} 
                    disabled={loginOtpLoading}
                    className="text-xs font-semibold text-[#8991a6] hover:text-[#facc15] transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-[#facc15]/10 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={loginOtpLoading ? "animate-spin" : ""} />
                    <span>Resend Code</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative space-y-5" suppressHydrationWarning>
            {/* 1-Click Social Sign-Up */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => social("google")}
                className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] hover:border-white/25 backdrop-blur-md text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google</span>
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => social("discord")}
                className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-[#5865f2]/35 bg-[#5865f2]/15 hover:bg-[#5865f2]/25 hover:border-[#5865f2]/50 backdrop-blur-md text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Gamepad2 size={16} className="text-[#5865f2]" />
                <span>Discord</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#151722]/90 backdrop-blur-md border border-white/10 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#a0a8c0]">
                or create with verified email
              </span>
            </div>

            {/* Email + Password + OTP Verification Flow */}
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleRegisterStep1} className="space-y-3.5" suppressHydrationWarning>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b8bfd6] mb-1.5">
                      Display Name / Gamer Tag
                    </label>
                    <input 
                      suppressHydrationWarning
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. ShadowHunter"
                      autoComplete="name"
                      required
                      className="h-10.5 w-full rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 backdrop-blur-md px-3.5 text-xs text-white placeholder-[#727a90] placeholder:text-xs transition-all duration-200 focus:border-white/40 focus:bg-black/80 focus:ring-2 focus:ring-white/10 focus:outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b8bfd6] mb-1.5">
                      Email Address
                    </label>
                    <input 
                      suppressHydrationWarning
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      autoComplete="email"
                      className="h-10.5 w-full rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 backdrop-blur-md px-3.5 text-xs text-white placeholder-[#727a90] placeholder:text-xs transition-all duration-200 focus:border-white/40 focus:bg-black/80 focus:ring-2 focus:ring-white/10 focus:outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b8bfd6] mb-1.5">
                      WhatsApp Number
                    </label>
                    <div className="relative group">
                      <input 
                        suppressHydrationWarning
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        autoComplete="tel"
                        className="h-10.5 w-full rounded-xl border border-white/15 bg-black/40 hover:bg-black/60 backdrop-blur-md pl-3.5 pr-10 text-xs text-white placeholder-[#727a90] placeholder:text-xs transition-all duration-200 focus:border-[#25d366] focus:bg-black/80 focus:ring-2 focus:ring-[#25d366]/20 focus:outline-none" 
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#25d366] pointer-events-none">
                        <MessageSquare size={15} />
                      </div>
                    </div>
                    <span className="mt-1 block text-[11px] text-[#a0a8c0]">
                      Used for instant game activation delivery & order tracking.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b8bfd6] mb-1.5">
                      Password
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
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <input 
                        suppressHydrationWarning
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
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

                  <p className="text-[11px] text-[#a0a8c0] pt-0.5 font-medium">
                    We will send a 6-digit verification code to confirm this email is yours.
                  </p>

                  <button 
                    suppressHydrationWarning
                    type="submit" 
                    disabled={otpLoading} 
                    className="w-full rounded-xl bg-gradient-to-r from-[#facc15] to-[#eab308] hover:from-[#ffe45c] hover:to-[#facc15] text-black h-11 font-black text-sm tracking-wide transition-all shadow-[0_0_24px_rgba(250,204,21,0.3)] hover:shadow-[0_0_35px_rgba(250,204,21,0.5)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 mt-2 active:scale-[0.99]"
                  >
                    {otpLoading ? "Sending Code..." : (
                      <>
                        <span>Continue to Verification</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#a0a8c0] pt-1 text-center font-medium">
                    <ShieldCheck size={13} className="shrink-0 text-[#00d68f]" />
                    <span>256-bit encrypted credentials & instant email verification.</span>
                  </p>
                </form>
              ) : (
                <div className="space-y-5">
                  <AnimatedOtpInput
                    length={6}
                    email={email}
                    name={displayName}
                    isLoading={otpLoading}
                    isError={Boolean(otpError)}
                    isSuccess={otpSuccess}
                    errorMessage={otpError}
                    onCodeChange={(code) => {
                      setOtpCode(code);
                      if (otpError) setOtpError("");
                    }}
                    onComplete={(code) => handleVerifyOtp(code)}
                  />

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                    <button 
                      type="button" 
                      onClick={() => {
                        setOtpSent(false);
                        setOtpError("");
                        setOtpSuccess(false);
                      }} 
                      disabled={otpLoading}
                      className="text-xs font-semibold text-[#8991a6] hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1 px-1.5 rounded hover:bg-white/5 disabled:opacity-50"
                    >
                      <ChevronLeft size={14} />
                      <span>Change Details</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setOtpError("");
                        setOtpSuccess(false);
                        handleRegisterStep1();
                      }} 
                      disabled={otpLoading}
                      className="text-xs font-semibold text-[#8991a6] hover:text-[#facc15] transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-[#facc15]/10 disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={otpLoading ? "animate-spin" : ""} />
                      <span>Resend Code</span>
                    </button>
                  </div>
                </div>
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