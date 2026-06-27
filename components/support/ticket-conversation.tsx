"use client";

import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Message = { id: number; user_id: string; message: string; is_staff: boolean; created_at: string };

export function TicketConversation({ ticketId, userId, initial, isStaff }: { ticketId: number; userId: string; initial: Message[]; isStaff: boolean }) {
  const [messages, setMessages] = useState(initial);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`ticket:${ticketId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` }, (payload) => {
      const row = payload.new as Message;
      setMessages((items) => items.some((item) => item.id === row.id) ? items : [...items, row]);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [ticketId]);
  async function send() {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    const { data, error } = await createClient().from("support_messages").insert({ ticket_id: ticketId, user_id: userId, message: text, is_staff: isStaff }).select("id,user_id,message,is_staff,created_at").single();
    setSending(false);
    if (error) return toast.error(error.message);
    setMessages((items) => items.some((item) => item.id === data.id) ? items : [...items, data]);
    setMessage("");
  }
  return <div><div className="min-h-64 space-y-3 rounded-md border border-white/[.08] bg-black/15 p-4">{messages.map((item) => <article key={item.id} className={`max-w-[88%] rounded-md p-4 ${item.is_staff ? "bg-[#b89412]/15" : item.user_id === userId ? "ml-auto bg-white/[.07]" : "bg-white/[.04]"}`}><div className="flex items-center justify-between gap-3"><strong className="text-xs">{item.is_staff ? "Rakexura support" : item.user_id === userId ? "You" : "Customer"}</strong><span className="text-[10px] text-[#737c91]">{new Date(item.created_at).toLocaleString("en-IN")}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#d5d9e5]">{item.message}</p></article>)}{!messages.length && <p className="py-16 text-center text-sm text-[#8991a6]">No replies yet. Send the first message below.</p>}</div><div className="mt-3 flex gap-2"><label className="sr-only" htmlFor="ticket-reply">Reply</label><textarea id="ticket-reply" value={message} onChange={(event) => setMessage(event.target.value)} rows={2} placeholder="Write a reply" className="min-w-0 flex-1 resize-none rounded-md border border-white/10 bg-black/20 p-3 outline-none focus:border-[#facc15]" /><button onClick={send} disabled={sending || !message.trim()} className="btn btn-primary self-stretch"><Send size={17} /><span className="hidden sm:inline">{sending ? "Sending..." : "Send"}</span></button></div></div>;
}
