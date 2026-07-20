import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { orderReference } = await req.json();
    if (!orderReference) {
      return NextResponse.json({ success: false, error: "Missing orderReference" }, { status: 400 });
    }

    const supabase = createClient();
    
    // 1. Fetch the order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, user_id, game_id, variant_type, cart_items")
      .eq("order_reference", orderReference)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // 2. Mark the order as Paid / Approved / Delivered
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "Approved",
        order_status: "Delivered",
        updated_at: new Date().toISOString()
      })
      .eq("order_reference", orderReference);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // 3. Replicate addDeliveredItemsToLibrary (adding games to customer_library)
    if (order.user_id && order.cart_items) {
      const items = Array.isArray(order.cart_items) ? order.cart_items : [];
      const rows = items
        .filter((item: unknown) => {
          const it = item as Record<string, unknown>;
          return it.type !== "bundle" && it.game_id;
        })
        .map((item: unknown) => {
          const it = item as Record<string, unknown>;
          return {
            user_id: order.user_id,
            game_id: it.game_id as number,
            order_id: order.id,
            platform: (it.platform as string) ?? order.variant_type ?? "Steam",
            delivery_notes: "Delivered automatically via UPI Verification Simulation",
          };
        });

      if (rows.length > 0) {
        await supabase.from("customer_library").upsert(rows, { onConflict: "user_id,game_id,platform" });
      }
    }

    return NextResponse.json({ success: true, message: "Payment successfully simulated and order delivered!" });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
