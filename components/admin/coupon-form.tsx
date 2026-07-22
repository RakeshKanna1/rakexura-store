"use client";

import { useState } from "react";
import { TicketPercent, Percent, IndianRupee } from "lucide-react";
import Link from "next/link";
import { saveCoupon } from "@/app/admin/actions";

const input = "mt-2 h-11 w-full rounded-lg border border-[#8b5cf6]/25 bg-[#070512] px-3.5 text-xs font-bold outline-none focus:border-[#b9a4ff] focus:ring-1 focus:ring-[#8b5cf6]/30 text-white placeholder-slate-600 transition-all [color-scheme:dark]";

type CouponValue = { id: number; code: string; discount_type: string; discount_value: number; minimum_order: number | null; usage_limit: number | null; per_user_limit: number | null; expires_at: string | null };

export function CouponForm({ coupon }: { coupon?: CouponValue | null }) {
  const expiry = coupon?.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "";
  const [discountType, setDiscountType] = useState(coupon?.discount_type ?? "percentage");

  return (
    <form key={coupon?.id ?? "new"} action={saveCoupon} className="premium-panel mt-8 rounded-xl p-6 md:p-8 border border-[#8b5cf6]/20 bg-[#0e0a1f]/90 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <p className="eyebrow text-[#b9a4ff]">Promotion</p>
      <h2 className="mt-2 text-2xl font-black text-white">{coupon ? "Edit coupon" : "Create coupon"}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col text-xs font-black uppercase tracking-wider text-slate-300">
          <span>Code</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] normal-case leading-relaxed">
            The exact code typed at checkout (e.g. RAKEXURA10). Uppercase, alphanumeric only.
          </span>
          <input name="code" required placeholder="RAKEXURA10" defaultValue={coupon?.code} className={`${input} uppercase font-extrabold tracking-wider`} />
        </label>
        
        <div className="flex flex-col text-xs font-black uppercase tracking-wider text-slate-300">
          <span>Discount type</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] normal-case leading-relaxed">
            How the discount is calculated: Percentage off or Fixed Rupees reduction.
          </span>
          <input type="hidden" name="discount_type" value={discountType} />
          <div className="mt-2 grid grid-cols-2 gap-2 h-11 p-1 rounded-lg border border-[#8b5cf6]/25 bg-[#070512]">
            <button
              type="button"
              onClick={() => setDiscountType("percentage")}
              className={`flex items-center justify-center gap-1.5 rounded-md text-xs font-black transition-all cursor-pointer ${
                discountType === "percentage"
                  ? "bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                  : "text-[#8991a8] hover:text-white hover:bg-white/5"
              }`}
            >
              <Percent size={13} /> Percentage
            </button>
            <button
              type="button"
              onClick={() => setDiscountType("flat")}
              className={`flex items-center justify-center gap-1.5 rounded-md text-xs font-black transition-all cursor-pointer ${
                discountType === "flat"
                  ? "bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                  : "text-[#8991a8] hover:text-white hover:bg-white/5"
              }`}
            >
              <IndianRupee size={13} /> Fixed Amount
            </button>
          </div>
        </div>
        
        <label className="flex flex-col text-xs font-black uppercase tracking-wider text-slate-300">
          <span>Discount value</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] normal-case leading-relaxed">
            Size of discount. Enter 10 for 10% off, or 150 for flat Rs. 150 reduction.
          </span>
          <input name="discount_value" type="number" min="1" required defaultValue={coupon?.discount_value} className={input} />
        </label>
        
        <label className="flex flex-col text-xs font-black uppercase tracking-wider text-slate-300">
          <span>Minimum order</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] normal-case leading-relaxed">
            Minimum cart amount needed to use this code (e.g. 500 for Rs. 500+). Use 0 for no minimum.
          </span>
          <input name="minimum_order" type="number" min="0" defaultValue={coupon?.minimum_order ?? 0} className={input} />
        </label>
        
        <label className="flex flex-col text-xs font-black uppercase tracking-wider text-slate-300">
          <span>Global Stock (Usage Limit)</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] normal-case leading-relaxed">
            Total times this code can be used globally across all customers. Leave empty for unlimited.
          </span>
          <input name="usage_limit" type="number" min="1" defaultValue={coupon?.usage_limit ?? undefined} className={input} />
        </label>
        
        <label className="flex flex-col text-xs font-black uppercase tracking-wider text-slate-300">
          <span>Limit per User</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] normal-case leading-relaxed">
            Maximum times a single customer account can redeem this code. Default is 1.
          </span>
          <input name="per_user_limit" type="number" min="1" defaultValue={coupon?.per_user_limit ?? 1} className={input} />
        </label>
        
        <label className="flex flex-col text-xs font-black uppercase tracking-wider text-slate-300">
          <span>Expires at</span>
          <span className="mt-1 text-[11px] font-normal text-[#8991a8] normal-case leading-relaxed">
            Optional date and time when this coupon will stop working automatically.
          </span>
          <input name="expires_at" type="datetime-local" defaultValue={expiry} className={`${input} cursor-pointer`} />
        </label>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
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
