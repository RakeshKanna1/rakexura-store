import Link from "next/link";
import { BarChart3, Boxes, MessageSquareText, PackageCheck, PackagePlus, Send, TicketPercent } from "lucide-react";
import { OnboardingHint } from "@/components/common/onboarding-hint";

const capabilities = [["Games", "/admin/games", Boxes], ["Combo deals", "/admin/bundles", PackagePlus], ["Orders", "/admin/orders", PackageCheck], ["Reviews", "/admin/reviews", MessageSquareText], ["Coupons", "/admin/coupons", TicketPercent], ["Analytics", "/admin/analytics", BarChart3], ["Requests", "/admin/requests", Send]] as const;

export function AdminOnboarding() {
  return <div className="mt-6"><OnboardingHint id="admin-control-center" title="Your no-code store control center"><p>Manage the daily Rakexura workflow here. Changes are protected by your Supabase admin role.</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{capabilities.map(([label, href, Icon]) => <Link href={href} key={label} className="flex min-h-10 items-center gap-2 rounded bg-black/20 px-3 py-2 transition hover:bg-white/[.06]"><Icon size={14} className="text-[#b9a4ff]" />{label}</Link>)}</div></OnboardingHint></div>;
}
