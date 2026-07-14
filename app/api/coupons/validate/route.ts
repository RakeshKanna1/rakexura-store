import { rateLimiter } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { isDiamondOrPlatinumCoupon } from "@/lib/utils";
import { NextResponse } from "next/server";
import { logError } from "@/lib/security/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateLimitKey = `rate-limit:coupon-validate:${ip}`;
    const limitRes = await rateLimiter.limit(rateLimitKey, 15, 60); // 15 attempts per minute
    if (!limitRes.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Too many coupon validation attempts. Please try again in a minute.",
            code: "RATE_LIMIT_EXCEEDED"
          }
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limitRes.reset - Math.floor(Date.now() / 1000))) }
        }
      );
    }

    const { code, gamePrice, subtotal, quantity, cartItemsCount } = await request.json().catch(() => ({}));
    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Coupon code is required",
            code: "VALIDATION_ERROR"
          }
        },
        { status: 400 }
      );
    }

    const normalized = code.trim().toUpperCase();
    const isDiamondOrPlat = isDiamondOrPlatinumCoupon(normalized);

    // 1. General coupon price check
    if (!isDiamondOrPlat && normalized !== "RAKETHREE" && gamePrice !== undefined && Number(gamePrice) < 99) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "General coupons can only be applied to games priced at Rs. 99 or above.",
            code: "PRICE_RESTRICTION"
          }
        },
        { status: 400 }
      );
    }

    // 2. RAKETHREE quantity check
    if (normalized === "RAKETHREE") {
      const itemsCount = cartItemsCount !== undefined ? Number(cartItemsCount) : (quantity !== undefined ? Number(quantity) : 1);
      if (itemsCount < 3) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "This code requires a minimum selection of 3 games to unlock your 10% discount.",
              code: "QUANTITY_RESTRICTION"
            }
          },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Database query for coupons
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("id,code,discount_type,discount_value,minimum_order,starts_at,expires_at,active,usage_limit,per_user_limit")
      .eq("code", normalized)
      .eq("active", true)
      .maybeSingle();

    if (error || !coupon || (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) || (coupon.starts_at && new Date(coupon.starts_at) > new Date())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "This coupon is invalid or not active",
            code: "INVALID_COUPON"
          }
        },
        { status: 400 }
      );
    }

    // 4. Milestone / Loyalty points check
    const isRestrictedCode = normalized === "RAKE20" || normalized === "DIAMONDFREE" || normalized === "DIAMOND-FREEBIE" || normalized === "PLATINUMFREE" || normalized === "PLATINUM-FREEBIE";
    if (isRestrictedCode) {
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Sign in to redeem loyalty rewards",
              code: "UNAUTHORIZED"
            }
          },
          { status: 401 }
        );
      }

      const { data: reward } = await supabase.from("user_rewards").select("points").eq("user_id", user.id).maybeSingle();
      const points = reward?.points ?? 0;

      if (normalized === "PLATINUMFREE" || normalized === "PLATINUM-FREEBIE") {
        if (points < 10000) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: "This exclusive code is only available to Platinum members (10,000+ points).",
                code: "INSUFFICIENT_POINTS"
              }
            },
            { status: 400 }
          );
        }
      } else {
        if (points < 4000) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: "This exclusive code is only available to Diamond or Platinum members (4,000+ points).",
                code: "INSUFFICIENT_POINTS"
              }
            },
            { status: 400 }
          );
        }
      }
    }

    const isMilestoneCoupon = normalized.startsWith("MILE") || normalized.startsWith("LOYAL") || normalized.startsWith("STAGE") || (normalized.startsWith("PLAT") && normalized !== "PLATINUMFREE" && normalized !== "PLATINUM-FREEBIE");
    if (isMilestoneCoupon) {
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Sign in to apply milestone loyalty coupons",
              code: "UNAUTHORIZED"
            }
          },
          { status: 401 }
        );
      }
      const { count } = await supabase.from("customer_library").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      if ((count ?? 0) < 3) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Unlock milestone coupons by purchasing 3 or more games on your account profile.",
              code: "INSUFFICIENT_PURCHASES"
            }
          },
          { status: 400 }
        );
      }
    }

    // 5. Global usage limit check
    if (coupon.usage_limit !== null) {
      const { count: globalUses } = await supabase
        .from("coupon_usage")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);
      if ((globalUses ?? 0) >= coupon.usage_limit) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "This coupon code has reached its global usage limit.",
              code: "USAGE_LIMIT_EXCEEDED"
            }
          },
          { status: 400 }
        );
      }
    }

    // 6. Per-user limit check
    if (user) {
      const { count } = await supabase
        .from("coupon_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("coupon_id", coupon.id);
      
      let userLimit = coupon.per_user_limit ?? 1;
      if (normalized === "PLATINUMFREE" || normalized === "PLATINUM-FREEBIE") {
        userLimit = 3;
      }

      if (count && count >= userLimit) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: normalized === "PLATINUMFREE" || normalized === "PLATINUM-FREEBIE"
                ? "Platinum loyalty freebies have reached the maximum limit of 3 redemptions."
                : normalized === "DIAMONDFREE" || normalized === "DIAMOND-FREEBIE"
                ? "Diamond loyalty freebie has already been claimed and locked."
                : `You have already redeemed this coupon the maximum allowed ${userLimit} time(s).`,
              code: "USER_LIMIT_EXCEEDED"
            }
          },
          { status: 400 }
        );
      }
    }

    // 7. Minimum order check (if subtotal is passed)
    if (subtotal !== undefined && Number(subtotal) < Number(coupon.minimum_order ?? 0)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Minimum order total of Rs. ${Number(coupon.minimum_order).toLocaleString("en-IN")} required`,
            code: "MIN_ORDER_NOT_MET"
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        minimum_order: Number(coupon.minimum_order ?? 0)
      }
    });
  } catch (err) {
    logError({
      category: "internal_error",
      message: "Coupon validation endpoint failure",
      error: err
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Internal server error during coupon validation",
          code: "INTERNAL_ERROR"
        }
      },
      { status: 500 }
    );
  }
}
