"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function SupportTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  async function submit() {
    if (subject.trim().length < 3 || message.trim().length < 10) return toast.error("Add a clear subject and message");
    setSending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return toast.error("Sign in to create a support ticket"); }
    const { data, error } = await supabase.from("support_tickets").insert({ user_id: user.id, subject: subject.trim(), message: message.trim() }).select("id").single();
    setSending(false);
    if (error) return toast.error(error.message);
    setSubject(""); setMessage("");
    toast.success("Support ticket created");
    router.push(`/dashboard/support/${data.id}`);
    router.refresh();
  }
  return <section className="premium-panel mt-8 rounded-md p-6"><h2 className="text-xl font-black">Create a support ticket</h2><p className="section-copy">Include an order reference when the issue is related to a purchase.</p><div className="mt-5 grid gap-3"><label className="sr-only" htmlFor="ticket-subject">Subject</label><input id="ticket-subject" name="subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" className="h-12 rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#facc15]" /><label className="sr-only" htmlFor="ticket-message">Message</label><textarea id="ticket-message" name="message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us what happened" rows={5} className="rounded-md border border-white/10 bg-black/25 p-4 outline-none focus:border-[#facc15]" /><button onClick={submit} disabled={sending} className="btn btn-primary">{sending ? "Sending..." : "Create ticket"}</button></div></section>;
}
