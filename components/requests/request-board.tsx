"use client";

import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Request = { id: number; game_name: string; platform: string; votes: number; status: string };

export function RequestBoard({ initial }: { initial: Request[] }) {
  const [requests, setRequests] = useState(initial);
  const vote = async (requestId: number) => { const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return toast.error("Sign in to vote"); const { error } = await supabase.from("game_votes").insert({ request_id: requestId, user_id: user.id }); if (error) return toast.error(error.code === "23505" ? "You already voted for this request" : error.message); setRequests((items) => items.map((item) => item.id === requestId ? { ...item, votes: item.votes + 1 } : item)); toast.success("Vote counted"); };
  if (!requests.length) return null;
  return <section className="mx-auto mt-10 max-w-3xl"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Community board</p><h2 className="section-title mt-2">Most requested</h2></div><span className="text-xs text-[#8991a6]">One vote per account</span></div><div className="space-y-3">{requests.map((request) => <article key={request.id} className="premium-panel flex items-center justify-between gap-4 rounded-md p-4"><div><strong>{request.game_name}</strong><p className="mt-1 text-xs text-[#8991a6]">{request.platform} · {request.status}</p></div><button onClick={() => vote(request.id)} className="flex min-w-16 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[.05] px-3 py-2 text-sm font-bold hover:bg-white/[.09]"><ArrowUp size={15} /> {request.votes}</button></article>)}</div></section>;
}
