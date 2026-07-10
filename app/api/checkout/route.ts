import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDiamondOrPlatinumCoupon } from "@/lib/utils";
import { rateLimiter } from "@/lib/security/rate-limit";
import { logError } from "@/lib/security/logger";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateLimitKey = `rate-limit:checkout:${ip}`;
    const limitRes = await rateLimiter.limit(rateLimitKey, 5, 60);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limitRes.reset - Math.floor(Date.now() / 1000)))) } }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { name, whatsapp, items, bundles, paymentReference, couponCode, paymentProofPath } = body;

    // Validate coupon code eligibility
    if (couponCode) {
      const normalized = couponCode.trim().toUpperCase();

      // Check game price restriction for general coupons (non-Diamond/Platinum)
      if (!isDiamondOrPlatinumCoupon(normalized)) {
        const hasLowPricedGame = Array.isArray(items) && items.some((item: { unit_price?: number }) => Number(item.unit_price ?? 0) <= 99);
        const hasLowPricedBundle = Array.isArray(bundles) && bundles.some((b: { unit_price?: number }) => Number(b.unit_price ?? 0) <= 99);
        if (hasLowPricedGame || hasLowPricedBundle) {
          return NextResponse.json({ error: "General coupons can only be applied to games priced above Rs. 99." }, { status: 400 });
        }
      }

      if (normalized === "RAKETHREE") {
        let totalQty = 0;
        if (Array.isArray(items)) {
          items.forEach((item: { quantity?: number }) => { totalQty += Number(item.quantity ?? 1); });
        }
        if (Array.isArray(bundles)) {
          bundles.forEach((item: { quantity?: number }) => { totalQty += Number(item.quantity ?? 1); });
        }
        if (totalQty < 3) {
          return NextResponse.json({ error: "This code requires a minimum selection of 3 games to unlock your 10% discount." }, { status: 400 });
        }
      }

      // Query historical order schema via coupon_usage
      if (user) {
        const { data: couponData } = await supabase
          .from("coupons")
          .select("id")
          .eq("code", normalized)
          .maybeSingle();

        if (couponData) {
          const { count } = await supabase
            .from("coupon_usage")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("coupon_id", couponData.id);

          if (count && count > 0) {
            return NextResponse.json({ error: "You have already redeemed this coupon once." }, { status: 400 });
          }
        }
      }

      const isFreeCode = normalized === "DIAMONDFREE" || normalized === "DIAMOND-FREEBIE" || normalized === "PLATINUMFREE" || normalized === "PLATINUM-FREEBIE";
      const isRake20 = normalized === "RAKE20";
      
      if (isFreeCode || isRake20) {
        if (!user) {
          return NextResponse.json({ error: "Sign in to redeem loyalty rewards" }, { status: 401 });
        }
        
        const { data: reward } = await supabase
          .from("user_rewards")
          .select("points, level")
          .eq("user_id", user.id)
          .maybeSingle();
          
        const points = reward?.points ?? 0;

        // Block ranks below Diamond (points < 4000)
        if (points < 4000) {
          return NextResponse.json({ 
            error: "This exclusive code is only available to Diamond or Platinum members. Keep buying games and referring friends to rank up!" 
          }, { status: 400 });
        }

        // Diamond reset exploit prevention
        if ((normalized === "DIAMONDFREE" || normalized === "DIAMOND-FREEBIE") && points < 4000) {
          return NextResponse.json({
            error: "Points have already been reset. You must rebuild points from scratch to re-unlock eligibility."
          }, { status: 400 });
        }
      }
    }

    // Call database RPC
    const { data, error } = await supabase.rpc("create_store_order", {
      p_customer_name: name,
      p_customer_whatsapp: whatsapp.replace(/\D/g, ""),
      p_items: items,
      p_bundles: bundles,
      p_payment_reference: paymentReference || null,
      p_coupon_code: couponCode || null,
      p_payment_proof_path: paymentProofPath || null
    });

    if (error) {
      logError({
        category: "validation_error",
        message: "Checkout database RPC failed",
        context: { name, whatsapp, couponCode, paymentReference },
        error
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, reference: data }, { status: 200 });
  } catch (error) {
    logError({
      category: "internal_error",
      message: "Checkout API route handler failed",
      error
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
