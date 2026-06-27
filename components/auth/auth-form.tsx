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
    if (!code || code.length < 6) {
      return toast.error("Enter the 6-digit verification code");
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
        
        {/* Auth Method Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setAuthMethod("otp")}
            className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition select-none ${
              authMethod === "otp" ? "border-[#6974ff] text-white" : "border-transparent text-[#8991a6]"
            }`}
          >
            ✉️ Email Verification Code (OTP)
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("password")}
            className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition select-none ${
              authMethod === "password" ? "border-[#6974ff] text-white" : "border-transparent text-[#8991a6]"
            }`}
          >
            🔒 Password
          </button>
        </div>

        {/* 1. OTP Code Auth Flow */}
        {authMethod === "otp" && (
          <div className="space-y-5">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                {mode === "register" && (
                  <label className="block text-sm font-semibold">
                    Display name
                    <input 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Gamer tag"
                      className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#6974ff] text-white" 
                    />
                  </label>
                )}
                <label className="block text-sm font-semibold">
                  Email address
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#6974ff] text-white" 
                  />
                </label>
                <Button disabled={otpLoading} className="w-full">
                  {otpLoading ? "Sending Code..." : "Send Verification Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="rounded-md border border-[#6974ff]/20 bg-[#6974ff]/5 p-4 text-xs text-[#a3aeff] leading-relaxed">
                  💡 We sent a 6-digit confirmation code to <strong>{email}</strong>. Copy the code and paste it below.
                </div>
                <label className="block text-sm font-semibold">
                  6-Digit OTP Code
                  <input 
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    pattern="[0-9]{6}"
                    className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#6974ff] text-center text-xl font-bold tracking-[0.4em] text-white" 
                  />
                </label>
                <Button disabled={otpLoading} className="w-full">
                  {otpLoading ? "Verifying..." : "Verify & Log In"}
                </Button>
                <div className="flex justify-between items-center text-xs">
                  <button 
                    type="button" 
                    onClick={() => setOtpSent(false)} 
                    className="text-[#8991a6] hover:text-white underline"
                  >
                    Change Email
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSendOtp} 
                    className="text-[#8991a6] hover:text-white underline"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center gap-3 text-xs text-[#727a90]"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => social("google")} className="flex h-12 items-center justify-center gap-3 rounded-md bg-white text-sm font-bold text-[#202124] transition hover:bg-[#f1f3f4]"><span className="text-base font-black text-[#4285f4]">G</span> Google</button>
              <button type="button" onClick={() => social("discord")} className="flex h-12 items-center justify-center gap-3 rounded-md bg-[#5865f2] text-sm font-bold text-white transition hover:bg-[#4752c4]"><Gamepad2 size={18} /> Discord</button>
            </div>
          </div>
        )}

        {/* 2. Password Auth Flow */}
        {authMethod === "password" && (
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-5">
            {mode === "register" && <label className="block text-sm font-semibold">Display name<input {...register("name")} autoComplete="name" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#6974ff]" /></label>}
            <label className="block text-sm font-semibold">Email<input {...emailField} type="email" autoComplete="email" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#6974ff]" />{errors.email && <span className="mt-1 block text-xs text-[#ff7373]">{errors.email.message}</span>}</label>
            <label className="block text-sm font-semibold">Password<input {...register("password")} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#6974ff]" />{errors.password && <span className="mt-1 block text-xs text-[#ff7373]">{errors.password.message}</span>}</label>
            <Button disabled={isSubmitting} className="w-full">{isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</Button>
            <div className="flex items-center gap-3 text-xs text-[#727a90]"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><button type="button" onClick={() => social("google")} className="flex h-12 items-center justify-center gap-3 rounded-md bg-white text-sm font-bold text-[#202124] transition hover:bg-[#f1f3f4]"><span className="text-base font-black text-[#4285f4]">G</span> Google</button><button type="button" onClick={() => social("discord")} className="flex h-12 items-center justify-center gap-3 rounded-md bg-[#5865f2] text-sm font-bold text-white transition hover:bg-[#4752c4]"><Gamepad2 size={18} /> Discord</button></div>
            <p className="flex items-center justify-center gap-2 text-[11px] text-[#7f879d]"><ShieldCheck size={13} /> Secure OAuth. Rakexura never receives your provider password.</p>
          </form>
        )}
      </div>

      {notice && <div className="mx-auto max-w-md rounded-md border border-[#00d68f]/20 bg-[#00d68f]/[.06] p-4"><div className="flex gap-3"><MailCheck className="shrink-0 text-[#70efbb]" /><p className="text-sm leading-6 text-[#b8d8cb]">{notice}</p></div></div>}
      {authMethod === "password" && (
        <>
          <div className="mx-auto grid max-w-md grid-cols-1 gap-2 sm:grid-cols-2"><button type="button" onClick={resend} disabled={emailAction !== null} className="btn btn-secondary text-sm"><RefreshCw size={16} /> {emailAction === "resend" ? "Sending..." : "Resend confirmation"}</button><button type="button" onClick={magicLink} disabled={emailAction !== null} className="btn btn-secondary text-sm"><MailCheck size={16} /> {emailAction === "magic" ? "Sending..." : "Use magic link"}</button></div>
          <p className="mx-auto max-w-md text-center text-xs leading-5 text-[#8991a6]">Email can take a few minutes. Check Promotions and Spam before resending.</p>
        </>
      )}
    </div>
  );
}
