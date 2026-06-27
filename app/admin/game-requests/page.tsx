import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { redirect } from "next/navigation";
import { updateRequestStatus } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { AdminAccessDenied } from "@/components/admin/access-denied";

function SubmitButton({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "positive" | "danger" }) {
  const color = tone === "positive" ? "border-[#00d68f]/30 text-[#70efbb]" : tone === "danger" ? "border-red-400/30 text-red-300" : "border-white/10 text-[#c8cedc]";
  return <button type="submit" className={`rounded border bg-black/20 px-3 py-2 text-xs font-bold transition hover:bg-white/[.06] ${color}`}>{children}</button>;
}

function RowActions({ id }: { id: number }) {
  return (
    <div className="flex min-w-60 flex-wrap gap-2">
      {["Reviewing", "Planned", "Added", "Declined"].map((status) => (
        <form action={updateRequestStatus} key={status}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={status} />
          <SubmitButton tone={status === "Declined" ? "danger" : status === "Added" ? "positive" : "neutral"}>
            {status}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}

export default async function AdminGameRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/game-requests");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return <AdminAccessDenied email={user.email} />;

  const { data: requests } = await supabase
    .from("game_requests")
    .select("id,game_name,platform,votes,status,created_at")
    .order("created_at", { ascending: false });

  const rows = requests ?? [];

  return (
    <div className="py-10">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white">
        <ArrowLeft size={16} /> Control center
      </Link>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Community Demand</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">
            Game Requests
          </h1>
          <p className="section-copy text-[#8991a6]">
            Manage user requested games. Coordinate catalog additions, mark planning statuses, or declare availability.
          </p>
        </div>
        <span className="rounded bg-white/[.05] px-3 py-2 text-xs font-bold">
          {rows.length} requests
        </span>
      </div>

      <div className="mt-8 overflow-x-auto rounded-md border border-[#8b5cf6]/20 bg-[#0c0a1a]/80">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-white/[.04] text-[#8991a6]">
            <tr>
              <th className="p-4">Game Name</th>
              <th className="p-4">Platform</th>
              <th className="p-4">Votes</th>
              <th className="p-4">Status</th>
              <th className="p-4">Requested On</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/[.07] hover:bg-white/[.025] transition-colors">
                <td className="p-4 font-bold text-white">
                  {row.game_name}
                </td>
                <td className="p-4 font-semibold text-[#b9a4ff]">
                  {row.platform}
                </td>
                <td className="p-4 font-bold text-white">
                  {row.votes}
                </td>
                <td className="p-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    row.status === "available"
                      ? "bg-[#00d68f]/10 text-[#00d68f]"
                      : row.status === "declined"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-white/[0.05] text-[#8991a6]"
                  }`}>
                    {row.status === "available" ? "Added" : row.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-[#8991a6]">
                  {new Date(row.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </td>
                <td className="p-4">
                  <RowActions id={row.id} />
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-[#8991a6]">
                  No game requests recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
