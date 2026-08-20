import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

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
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#facc15] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-md shadow-[#facc15]/15 transition-all duration-200 hover:bg-[#fde047] hover:scale-[1.02] active:scale-95 cursor-pointer"
      >
        <span>{action}</span>
        <ArrowRight size={14} className="stroke-[2.5]" />
      </Link>
    </div>
  );
}
