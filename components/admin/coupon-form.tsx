import { TicketPercent } from "lucide-react";
import Link from "next/link";
import { saveCoupon } from "@/app/admin/actions";

const input = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#facc15]";

type CouponValue = { id: number; code: string; discount_type: string; discount_value: number; minimum_order: number | null; usage_limit: number | null; expires_at: string | null };

export function CouponForm({ coupon }: { coupon?: CouponValue | null }) {
  const expiry = coupon?.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "";
  return <form key={coupon?.id ?? "new"} action={saveCoupon} className="premium-panel mt-8 rounded-md p-5 md:p-7">{coupon && <input type="hidden" name="id" value={coupon.id} />}<p className="eyebrow">Promotion</p><h2 className="mt-2 text-2xl font-black">{coupon ? "Edit coupon" : "Create coupon"}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className="text-sm font-bold">Code<input name="code" required placeholder="RAKEXURA10" defaultValue={coupon?.code} className={input} /></label><label className="text-sm font-bold">Discount type<select name="discount_type" defaultValue={coupon?.discount_type ?? "percentage"} className={input}><option value="percentage">Percentage</option><option value="flat">Fixed amount</option></select></label><label className="text-sm font-bold">Discount value<input name="discount_value" type="number" min="1" required defaultValue={coupon?.discount_value} className={input} /></label><label className="text-sm font-bold">Minimum order<input name="minimum_order" type="number" min="0" defaultValue={coupon?.minimum_order ?? 0} className={input} /></label><label className="text-sm font-bold">Global Stock (Usage Limit)<input name="usage_limit" type="number" min="1" defaultValue={coupon?.usage_limit ?? undefined} className={input} /></label><label className="text-sm font-bold">Expires at<input name="expires_at" type="datetime-local" defaultValue={expiry} className={input} /></label></div><div className="mt-6 flex flex-wrap gap-3"><button className="btn btn-primary"><TicketPercent size={17} /> {coupon ? "Save changes" : "Create coupon"}</button>{coupon && <Link href="/admin/coupons" className="btn btn-secondary">Cancel edit</Link>}</div></form>;
}
