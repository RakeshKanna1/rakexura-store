"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return <div className="page-shell pt-3"><button type="button" onClick={goBack} className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-[#a0a8c0] transition hover:bg-white/[.05] hover:text-white" aria-label="Go back"><ArrowLeft size={17} /> Back</button></div>;
}
