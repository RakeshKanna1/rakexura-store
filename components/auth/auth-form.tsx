"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Gamepad2, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/common/button";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ 
  email: z.string().email("Enter a valid email"), 
  password: z.string().min(8, "Use at least 8 characters"), 
  name: z.string().optional() 
});
type Values = z.infer<typeof schema>;

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
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  
  // OTP States
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [notice, setNotice] = useState("");
  const [emailAction, setEmailAction] = useState<"resend" | "magic" | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ 
    resolver: zodResolver(schema) 
  });

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

    setOtpLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: redirectTo(),
        shouldCreateUser: true, // Automatically registers the user if they don't have an account
      }
    });

    setOtpLoading(false);
    if (error) return toast.error(friendlyAuthError(error.message));
    
    setOtpSent(true);
    toast.success("Verification code sent to your email. Check inbox and spam folders.");
  }

  // OTP - Verify Code
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otpCode.trim();
    if (!code || code.length < 6 || code.length > 8) {
      return toast.error("Enter a valid 6 to 8-digit verification code");
    }

    setOtpLoading(true);
    const supabase = createClient();

    // 1. Try with type: "email"
    let { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email"
    });

    // 2. Fallback to type: "magiclink"
    if (error) {
      const fallback = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "magiclink"
      });
      data = fallback.data;
      error = fallback.error;
    }

    // 3. Fallback to type: "signup" (for brand new accounts confirmation)
    if (error) {
      const fallbackSignup = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "signup"
      });
      data = fallbackSignup.data;
      error = fallbackSignup.error;
    }

    // Update display name if user is new & signed up in OTP flow
    if (!error && data?.user && displayName.trim()) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: displayName.trim(),
        full_name: displayName.trim(),
      });
    }

    setOtpLoading(false);
    if (error) return toast.error(friendlyAuthError(error.message));

    toast.success("Sign in successful!");
    await routeSignedInUser();
  }

  // Password - Submit
  async function onSubmitPassword(values: Values) {
    const supabase = createClient(); 
    setEmail(values.email); 
    setNotice("");

    if (mode === "login") { 
      const { error } = await supabase.auth.signInWithPassword({ 
        email: values.email, 
        password: values.password 
      }); 
      if (error) return toast.error(friendlyAuthError(error.message)); 
      toast.success("Welcome back"); 
      await routeSignedInUser(); 
      return; 
    }

    const { data, error } = await supabase.auth.signUp({ 
      email: values.email, 
      password: values.password, 
      options: { 
        emailRedirectTo: redirectTo(), 
        data: { 
          display_name: values.name, 
          full_name: values.name 
        } 
      } 
    });

    if (error) return toast.error(friendlyAuthError(error.message));
    
    if (data.session) { 
      toast.success("Account created and signed in"); 
      await routeSignedInUser(); 
      return; 
    }

    setNotice("Account created. Please check your email inbox and spam folder. You can resend the verification email below."); 
    toast.success("Account created. Check your email to continue.");
  }

  async function resend() { 
    if (!email) return toast.error("Enter your email and create the account first."); 
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

  const emailField = register("email", { onChange: (event) => setEmail(event.target.value) });

  return (
    <div className="space-y-4">
      <div className="glass mx-auto max-w-md overflow-hidden rounded-lg p-6 md:p-8">
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
            {/* Social sign up buttons */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button suppressHydrationWarning type="button" onClick={() => social("google")} className="flex h-11 items-center justify-center gap-2.5 rounded-md bg-white text-xs font-bold text-[#202124] transition hover:bg-[#f1f3f4] cursor-pointer"><span className="text-sm font-black text-[#4285f4]">G</span> Google</button>
              <button suppressHydrationWarning type="button" onClick={() => social("discord")} className="flex h-11 items-center justify-center gap-2.5 rounded-md bg-[#5865f2] text-xs font-bold text-white transition hover:bg-[#4752c4] cursor-pointer"><Gamepad2 size={16} /> Discord</button>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#727a90]"><span className="h-px flex-1 bg-white/10" /><span>or register with email</span><span className="h-px flex-1 bg-white/10" /></div>

            {/* Auth Method Tabs */}
            <div className="flex border-b border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setAuthMethod("password")}
                className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition select-none cursor-pointer ${
                  authMethod === "password" ? "border-[#facc15] text-[#facc15]" : "border-transparent text-[#8991a6] hover:text-white"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod("otp")}
                className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition select-none cursor-pointer ${
                  authMethod === "otp" ? "border-[#facc15] text-[#facc15]" : "border-transparent text-[#8991a6] hover:text-white"
                }`}
              >
                Email Code (OTP)
              </button>
            </div>

            {/* Password Registration Flow */}
            {authMethod === "password" && (
              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#a0a8c0] mb-1.5">
                    Display Name / Gamer Tag
                  </label>
                  <input 
                    {...register("name")} 
                    autoComplete="name" 
                    placeholder="e.g. ShadowHunter" 
                    className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#facc15] focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#a0a8c0] mb-1.5">
                    Email Address
                  </label>
                  <input 
                    {...emailField} 
                    type="email" 
                    autoComplete="email" 
                    placeholder="you@example.com" 
                    className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#facc15] focus:outline-none" 
                  />
                  {errors.email && <span className="mt-1 block text-xs text-[#ff7373]">{errors.email.message}</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#a0a8c0] mb-1.5">
                    Password
                  </label>
                  <input 
                    {...register("password")} 
                    type="password" 
                    autoComplete="new-password" 
                    placeholder="At least 8 characters" 
                    className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#facc15] focus:outline-none" 
                  />
                  {errors.password && <span className="mt-1 block text-xs text-[#ff7373]">{errors.password.message}</span>}
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full rounded-md bg-[#facc15] hover:bg-[#ffe45c] h-11 font-black text-black text-sm transition shadow-md shadow-[#facc15]/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#7f879d] pt-1 text-center">
                  <ShieldCheck size={13} className="shrink-0 text-[#00d68f]" />
                  <span>Encrypted credentials. Instant access to your dashboard.</span>
                </p>
              </form>
            )}

            {/* OTP Code Registration Flow */}
            {authMethod === "otp" && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#a0a8c0] mb-1.5">
                        Display Name / Gamer Tag
                      </label>
                      <input 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. ShadowHunter"
                        autoComplete="name"
                        className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#facc15] focus:outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#a0a8c0] mb-1.5">
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

                    <button 
                      type="submit" 
                      disabled={otpLoading} 
                      className="w-full rounded-md bg-[#facc15] hover:bg-[#ffe45c] h-11 font-black text-black text-sm transition shadow-md shadow-[#facc15]/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {otpLoading ? "Sending Code..." : "Send Verification Code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="rounded-md border border-[#facc15]/20 bg-[#facc15]/5 p-3 text-xs text-[#a0a8c0] text-center leading-relaxed">
                      We sent a verification code to <strong className="text-white">{email}</strong>. Copy and paste it below:
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#a0a8c0] mb-1.5">
                        Verification Code (OTP)
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
                        className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-center text-lg font-black tracking-[0.2em] text-white placeholder-zinc-500 transition-colors focus:border-[#facc15] focus:outline-none" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={otpLoading} 
                      className="w-full rounded-md bg-[#facc15] hover:bg-[#ffe45c] h-11 font-black text-black text-sm transition shadow-md shadow-[#facc15]/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {otpLoading ? "Verifying..." : "Verify & Create Account"}
                    </button>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <button 
                        type="button" 
                        onClick={() => setOtpSent(false)} 
                        className="text-[#8991a6] hover:text-white underline cursor-pointer"
                      >
                        Change Email
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
            )}
          </div>
        )}
      </div>

      {notice && (
        <div className="mx-auto max-w-md rounded-md border border-[#00d68f]/20 bg-[#00d68f]/[.06] p-4">
          <div className="flex gap-3">
            <MailCheck className="shrink-0 text-[#70efbb]" />
            <p className="text-sm leading-6 text-[#b8d8cb]">{notice}</p>
          </div>
        </div>
      )}
    </div>
  );
}
