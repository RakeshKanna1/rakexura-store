import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminAccessDenied } from "@/components/admin/access-denied";
import { getAuthenticatedUser, getCurrentUserProfile } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const profile = await getCurrentUserProfile();

  if (profile?.role !== "admin") {
    return <AdminAccessDenied email={user.email} />;
  }

  return (
    <div className="relative min-h-screen bg-black w-full">
      {/* Subtle brand color gradient glow matching logo signature colors */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.06),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(167,139,250,0.03),transparent_50%)]" />
      
      <div className="relative z-10 page-shell grid gap-6 py-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24 z-20">
          <AdminNav />
        </aside>
        
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
