import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { TicketConversation } from "@/components/support/ticket-conversation";
import { TicketStatusControls } from "@/components/support/ticket-status-controls";
import { createClient } from "@/lib/supabase/server";

export default async function SupportConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/support/${id}`)}`);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const { data: ticket } = await supabase.from("support_tickets").select("id,subject,message,status,created_at").eq("id", Number(id)).maybeSingle();
  if (!ticket) notFound();
  const { data: messages } = await supabase.from("support_messages").select("id,user_id,message,is_staff,created_at").eq("ticket_id", ticket.id).order("created_at");
  const isStaff = profile?.role === "admin";

  return (
    <div className="page-shell py-10">
      <Link href="/dashboard/support" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6]">
        <ArrowLeft size={16} /> Support tickets
      </Link>
      <div className="mx-auto mt-6 max-w-4xl">
        <div className="premium-panel rounded-md p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="eyebrow">Private support ticket #{ticket.id}</p>
              <h1 className="mt-2 text-2xl font-black md:text-4xl text-white">{ticket.subject}</h1>
            </div>
            <TicketStatusControls ticketId={ticket.id} currentStatus={ticket.status} isStaff={isStaff} />
          </div>
          <div className="mt-5 rounded-md bg-black/30 p-4 text-sm leading-6 text-[#b9c0d0] border border-white/5">
            {ticket.message}
          </div>
          <div className="mt-6">
            <TicketConversation ticketId={ticket.id} userId={user.id} initial={messages ?? []} isStaff={isStaff} />
          </div>
        </div>
      </div>
    </div>
  );
}
