import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  message,
  href,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  message?: string;
  href: string;
  action: string;
}) {
  return (

    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0c0a1a]/70 px-6 py-14 text-center backdrop-blur-md">
      <Icon className="text-[#596176]" size={42} strokeWidth={1.8} />
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[#8991a6]">
        {description || message}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#facc15] hover:text-[#fde047] transition-colors"
      >
        <span>{action}</span>
        <span className="text-sm">&rarr;</span>
      </Link>
    </div>
  );
}
