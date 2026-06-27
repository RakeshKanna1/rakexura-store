import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, message, href, action }: { icon: LucideIcon; title: string; description?: string; message?: string; href: string; action: string }) {
  return <div className="premium-panel rounded-md px-6 py-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/[.04]"><Icon className="text-[#facc15]" /></span><h2 className="mt-5 text-2xl font-black">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8991a6]">{description || message}</p><Link href={href} className="btn btn-primary mt-6">{action}</Link></div>;
}
