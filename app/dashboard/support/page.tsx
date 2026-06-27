import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/common/empty-state";
import { SupportTicketForm } from "@/components/support/support-ticket-form";
import { createClient } from "@/lib/supabase/server";

export default async function SupportTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/support");
  const { data: tickets } = await supabase.from("support_tickets").select("id,subject,status,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  return <div className="page-shell py-10"><Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6]"><ArrowLeft size={16} /> Dashboard</Link><div className="mt-6"><p className="eyebrow">Account</p><h1 className="mt-2 text-3xl font-black md:text-5xl">Support tickets</h1><p className="section-copy">Keep order questions and staff replies in one private conversation.</p></div><div className="mt-8 space-y-3">{tickets?.map((ticket) => <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`} className="premium-panel flex min-h-20 items-center justify-between gap-4 rounded-md p-5 transition hover:border-white/20"><div><strong>{ticket.subject}</strong><p className="mt-1 text-xs text-[#8991a6]">Opened {new Date(ticket.created_at).toLocaleDateString("en-IN")}</p></div><span className="rounded bg-white/[.06] px-3 py-2 text-xs font-bold capitalize">{ticket.status.replace("_", " ")}</span></Link>)}{!tickets?.length && <EmptyState icon={LifeBuoy} title="No support tickets" description="Create a private ticket when you need help with an order or delivery." href="#new-ticket" action="Create a ticket below" />}</div><div id="new-ticket"><SupportTicketForm /></div></div>;
}
