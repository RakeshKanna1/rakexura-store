import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ExpiredCouponRow = {
  id: number | string;
  code: string;
  expires_at: string | null;
};

/**
 * Automatically purges coupons whose expiry date and time have passed.
 * Cleans up foreign references in coupon_usage and permanently deletes expired coupons from the database.
 */
export async function purgeExpiredCoupons(supabaseClient?: SupabaseClient): Promise<number> {
  try {
    const supabase = supabaseClient || (await createClient());
    const nowIso = new Date().toISOString();

    // 1. Find all expired coupon IDs
    const { data, error: findError } = await supabase
      .from("coupons")
      .select("id, code, expires_at")
      .not("expires_at", "is", null)
      .lte("expires_at", nowIso);

    if (findError) {
      console.warn("Could not query expired coupons for cleanup:", findError.message);
      return 0;
    }

    const expired = (data || []) as ExpiredCouponRow[];
    if (expired.length === 0) {
      return 0;
    }

    const expiredIds = expired
      .map((c: ExpiredCouponRow) => Number(c.id))
      .filter((id: number) => !isNaN(id));

    if (expiredIds.length === 0) return 0;

    // 2. Remove dependent usage logs to preserve foreign key constraints
    try {
      await supabase.from("coupon_usage").delete().in("coupon_id", expiredIds);
    } catch {
      // Ignore if foreign key is not present or already deleted
    }

    // 3. Permanently delete expired coupons from the coupons table
    const { error: deleteError } = await supabase
      .from("coupons")
      .delete()
      .in("id", expiredIds);

    if (deleteError) {
      console.error("Failed to auto-delete expired coupons:", deleteError.message);
      return 0;
    }

    console.log(
      `[Coupons] Automatically deleted ${expiredIds.length} expired coupon(s):`,
      expired.map((c: ExpiredCouponRow) => `${c.code} (expired at ${c.expires_at})`).join(", ")
    );

    return expiredIds.length;
  } catch (err) {
    console.error("Error during auto-deletion of expired coupons:", err);
    return 0;
  }
}
