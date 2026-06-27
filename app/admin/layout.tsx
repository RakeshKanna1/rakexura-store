import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden w-full">
      {/* Subtle brand color gradient glow matching logo signature colors (increased to 6% and 3% for premium mild purple theme) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.06),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(167,139,250,0.03),transparent_50%)]" />
      
      <div className="relative z-10 page-shell grid gap-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[100px] lg:h-[calc(100vh-124px)]">
          <AdminNav />
        </aside>
        
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
