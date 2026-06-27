import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { OwnerActivation } from "@/components/admin/owner-activation";

export function AdminAccessDenied({ email }: { email?: string | null }) {
  const ownerEmail = (process.env.OWNER_EMAIL ?? process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "12k21rakeshkannam@gmail.com").trim().toLowerCase();
  const isOwner = Boolean(email && ownerEmail && email.toLowerCase() === ownerEmail);
  return <div className="page-shell grid min-h-[70vh] place-items-center py-12"><section className="premium-panel max-w-lg rounded-md p-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#facc15]/10 text-[#facc15]"><LockKeyhole /></span><p className="eyebrow mt-6">Protected administration</p><h1 className="mt-3 text-3xl font-black">You are logged in as customer</h1><p className="mt-3 text-sm leading-6 text-[#8991a6]">{isOwner ? "Your email matches the configured store owner. Activate admin access once to open the control center." : "Admin tools are visible only to authorized store staff. If you are the owner, sign in using the configured owner email."}</p><div className="mt-6 grid gap-2">{isOwner && <OwnerActivation />}<div className="grid gap-2 sm:grid-cols-2"><Link href="/dashboard" className="btn btn-primary">Customer dashboard</Link><Link href="/support" className="btn btn-secondary">Contact support</Link></div></div></section></div>;
}
