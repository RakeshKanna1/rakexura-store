import { redirect } from "next/navigation";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ prefill?: string }> }) {
  const query = await searchParams;
  const prefill = query.prefill ?? "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/messages");
  const { data: owner } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (owner?.role !== "admin") redirect("/dashboard");
  const [{ data: customers }, { data: games }] = await Promise.all([supabase.from("profiles").select("id,display_name,whatsapp").eq("role", "customer").order("display_name"), supabase.from("games").select("id,title").eq("archived", false).order("title")]);
  return <main><p className="eyebrow">Customer communication</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Messages & announcements</h1><p className="section-copy mb-8">Tell customers about new games, offers, and giveaways without editing code.</p><BroadcastComposer customers={customers ?? []} games={games ?? []} prefill={prefill} /></main>;
}
