import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Direct Purchases count:
    const { count: libraryCount } = await supabase
      .from("customer_library")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 2. Viral Referrals count:
    const { count: referralCount } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    const purchasePoints = (libraryCount ?? 0) * 100;
    const referralPoints = (referralCount ?? 0) * 500;
    const totalPoints = Math.min(10000, purchasePoints + referralPoints);

    let level = "Bronze";
    if (totalPoints >= 10000) level = "Platinum";
    else if (totalPoints >= 5000) level = "Diamond";
    else if (totalPoints >= 3000) level = "Gold";
    else if (totalPoints >= 1000) level = "Silver";

    // Upsert into user_rewards table to keep database in sync
    await supabase
      .from("user_rewards")
      .upsert({ user_id: user.id, points: totalPoints, level })
      .select();

    return NextResponse.json({
      success: true,
      points: totalPoints,
      level,
      libraryCount: libraryCount ?? 0,
      referralCount: referralCount ?? 0,
      purchasePoints,
      referralPoints,
    }, { status: 200 });
  } catch (error) {
    console.error("Error in profile rewards validation api:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
