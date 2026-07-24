import { redirect } from "next/navigation";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ prefill?: string }> }) {
  const query = await searchParams;
  const prefill = query.prefill ?? "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/messages");
  const { data: owner } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (owner?.role !== "admin") redirect("/dashboard");

  const adminSupabase = createAdminClient();
  const emailMap = new Map<string, string>();
  try {
    const { data: authData } = await adminSupabase.auth.admin.listUsers();
    if (authData?.users) {
      authData.users.forEach((u) => {
        if (u.id && u.email) {
          emailMap.set(u.id, u.email);
        }
      });
    }
  } catch (err) {
    console.warn("Could not list auth users for email map:", err);
  }

  const [{ data: rawCustomers }, { data: games }] = await Promise.all([
    supabase.from("profiles").select("id,display_name,whatsapp,email").eq("role", "customer").order("display_name"),
    supabase.from("games").select("id,title").eq("archived", false).order("title")
  ]);

  const customers = (rawCustomers ?? []).map((c) => {
    const email = c.email || emailMap.get(c.id) || null;
    return {
      ...c,
      email,
    };
  });

  // Sync missing emails to profiles table in background
  const missingSync = (rawCustomers ?? []).filter((c) => !c.email && emailMap.has(c.id));
  if (missingSync.length > 0) {
    void Promise.allSettled(
      missingSync.map((c) => adminSupabase.from("profiles").update({ email: emailMap.get(c.id) }).eq("id", c.id))
    );
  }

  return (
    <main>
      <p className="eyebrow">Customer communication</p>
      <h1 className="mt-3 text-4xl font-black md:text-5xl">Messages & announcements</h1>
      <p className="section-copy mb-8">Tell customers about new games, offers, and giveaways without editing code.</p>
      <BroadcastComposer customers={customers} games={games ?? []} prefill={prefill} />
    </main>
  );
}
