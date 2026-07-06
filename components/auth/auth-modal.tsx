"use client";

import { useState } from "react";
import { Gamepad2, ShieldCheck, X, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
}

export function AuthModal({ isOpen, onClose, onContinueAsGuest }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function socialLogin(provider: "google" | "discord") {
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      toast.error(error.message);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      return toast.error("Enter a valid email address");
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setMagicLinkSent(true);
      toast.success("Magic link sent! Check your inbox and spam folders.");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sign in modal"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070913]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl md:p-8"
          >
            {/* Elegant Background Glow */}
            <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
            <div className="absolute -right-16 -bottom-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/[0.05] text-[#8991a6] hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Sign In to <span className="bg-gradient-to-r from-amber-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">Rakexura</span>
              </h2>
              <p className="mt-2 text-xs text-[#8991a6] leading-relaxed">
                Enjoy cloud sync, loyalty rewards, order history, and faster assisted deliveries by signing in first.
              </p>
            </div>

            {/* Social Logins */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => socialLogin("google")}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white text-sm font-bold text-[#202124] transition hover:bg-[#f1f3f4] active:scale-[0.98]"
              >
                {/* Google Icon G logo */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.87 3C6.18 7.62 8.84 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.92c2.2-2.03 3.67-5.01 3.67-8.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.26 14.56c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.39 6.94C.5 8.71 0 10.79 0 13s.5 4.29 1.39 6.06l3.87-3.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.76-2.92c-1.1.74-2.52 1.18-4.2 1.18-3.16 0-5.82-2.58-6.78-5.52l-3.87 3C3.37 20.33 7.35 23 12 23z"
                  />
                </svg>
                Sign In with Google
              </button>
              <button
                type="button"
                onClick={() => socialLogin("discord")}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#5865f2] text-sm font-bold text-white transition hover:bg-[#4752c4] active:scale-[0.98]"
              >
                <Gamepad2 size={20} />
                Sign In with Discord
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <span className="relative bg-[#070913] px-3 text-[10px] font-bold uppercase tracking-wider text-[#646b7b]">
                Or use email
              </span>
            </div>

            {/* Email Magic Link */}
            {magicLinkSent ? (
              <div className="rounded-xl border border-[#70efbb]/20 bg-[#70efbb]/[0.02] p-4 text-center text-xs leading-relaxed text-[#70efbb]">
                ✉️ A login link has been sent to <strong>{email}</strong>.<br />Check your inbox and spam folders to sign in.
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/35 pl-10 pr-4 text-xs text-white outline-none focus:border-violet-500 transition-colors"
                  />
                  <Mail className="absolute left-3.5 top-3.5 text-[#8991a6]" size={15} />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-secondary h-11 min-h-11 w-full text-xs font-bold"
                >
                  {loading ? "Sending..." : "Send Magic Link"}
                </button>
              </form>
            )}

            {/* Footer / Continue as Guest */}
            <div className="mt-6 border-t border-white/[0.08] pt-4 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-bold text-[#a0a8c0] hover:text-white transition-colors"
              >
                Continue checkout as Guest &rarr;
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#646b7b]">
                <ShieldCheck size={12} /> Secure sign-in. Your data is protected by Supabase Auth.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
