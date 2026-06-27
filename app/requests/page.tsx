import { RequestBoard } from "@/components/requests/request-board";
import { RequestForm } from "@/components/requests/request-form";
import { createClient } from "@/lib/supabase/server";

export default async function RequestsPage() {
  const supabase = await createClient(); const { data } = await supabase.from("game_requests").select("id,game_name,platform,votes,status").order("votes", { ascending: false }).limit(20);
  return <div className="shell py-14"><div className="mb-8 text-center"><p className="eyebrow mb-3">Community requests</p><h1 className="text-4xl font-bold">Can’t find a game?</h1><p className="muted mt-3">Tell us what you want next. Popular requests help shape the catalog.</p></div><RequestForm /><RequestBoard initial={data ?? []} /></div>;
}
