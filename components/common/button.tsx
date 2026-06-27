import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-black transition hover:bg-[#e9e9ed] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}
