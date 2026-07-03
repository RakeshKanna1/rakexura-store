import { TicketPercent } from "lucide-react";
import Link from "next/link";
import { saveCoupon } from "@/app/admin/actions";

const input = "mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#facc15]";

type CouponValue = { id: number; code: string; discount_type: string; discount_value: number; minimum_order: number | null; usage_limit: number | null; per_user_limit: number | null; expires_at: string | null };

export function CouponForm({ coupon }: { coupon?: CouponValue | null }) {
  const expiry = coupon?.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "";
  return (
    <form key={coupon?.id ?? "new"} action={saveCoupon} className="premium-panel mt-8 rounded-md p-5 md:p-7">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <p className="eyebrow">Promotion</p>
      <h2 className="mt-2 text-2xl font-black">{coupon ? "Edit coupon" : "Create coupon"}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col text-sm font-bold">
          <span>Code</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            The exact code typed at checkout (e.g. RAKEXURA10). Uppercase, alphanumeric only.
          </span>
          <input name="code" required placeholder="RAKEXURA10" defaultValue={coupon?.code} className={input} />
        </label>
        
        <label className="flex flex-col text-sm font-bold">
          <span>Discount type</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            How the discount is calculated: Percentage off or Fixed Rupees reduction.
          </span>
          <select name="discount_type" defaultValue={coupon?.discount_type ?? "percentage"} className={input}>
            <option value="percentage">Percentage</option>
            <option value="flat">Fixed amount</option>
          </select>
        </label>
        
        <label className="flex flex-col text-sm font-bold">
          <span>Discount value</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Size of discount. Enter 10 for 10% off, or 150 for flat Rs. 150 reduction.
          </span>
          <input name="discount_value" type="number" min="1" required defaultValue={coupon?.discount_value} className={input} />
        </label>
        
        <label className="flex flex-col text-sm font-bold">
          <span>Minimum order</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Minimum cart amount needed to use this code (e.g. 500 for Rs. 500+). Use 0 for no minimum.
          </span>
          <input name="minimum_order" type="number" min="0" defaultValue={coupon?.minimum_order ?? 0} className={input} />
        </label>
        
        <label className="flex flex-col text-sm font-bold">
          <span>Global Stock (Usage Limit)</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Total times this code can be used globally across all customers. Leave empty for unlimited.
          </span>
          <input name="usage_limit" type="number" min="1" defaultValue={coupon?.usage_limit ?? undefined} className={input} />
        </label>
        
        <label className="flex flex-col text-sm font-bold">
          <span>Limit per User</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Maximum times a single customer account can redeem this code. Default is 1.
          </span>
          <input name="per_user_limit" type="number" min="1" defaultValue={coupon?.per_user_limit ?? 1} className={input} />
        </label>
        
        <label className="flex flex-col text-sm font-bold">
          <span>Expires at</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] leading-relaxed">
            Optional date and time when this coupon will stop working automatically.
          </span>
          <input name="expires_at" type="datetime-local" defaultValue={expiry} className={input} />
        </label>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn btn-primary">
          <TicketPercent size={17} /> {coupon ? "Save changes" : "Create coupon"}
        </button>
        {coupon && (
          <Link href="/admin/coupons" className="btn btn-secondary">
            Cancel edit
          </Link>
        )}
      </div>
    </form>
  );
}
