import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/server";
import { makeCustomerInvoiceMessage, makeEpicReceiptHtml, type OrderNotice } from "@/lib/receipt-template";
import { rateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateResult = await rateLimiter.limit(`resend-invoice:${ip}`, 5, 60);
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: "Too many invoice requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { orderReference, email, customerPhone } = body;

    if (!orderReference || typeof orderReference !== "string") {
      return NextResponse.json(
        { success: false, error: "Order reference is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const trimmedRef = orderReference.trim();
    const targetEmail = email.trim().toLowerCase();

    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_reference, order_status, total_price, created_at, cart_items, customer_name, customer_whatsapp, customer_email, user_id")
      .eq("order_reference", trimmedRef)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found. Please verify your order reference." },
        { status: 404 }
      );
    }

    // Prepare line items
    const rawItems = Array.isArray(order.cart_items) ? order.cart_items : [];
    const items = rawItems.map((item: Record<string, unknown>) => ({
      title: String(item.title || item.name || "PC Game"),
      platform: String(item.platform || "Steam"),
      quantity: Number(item.quantity || 1),
      price: Number(item.unit_price || item.price || 0),
    }));

    const orderNotice: OrderNotice = {
      reference: order.order_reference,
      customerName: order.customer_name || "Valued Customer",
      customerWhatsApp: order.customer_whatsapp || customerPhone || "",
      customerEmail: targetEmail,
      total: Number(order.total_price || 0),
      items: items.length > 0 ? items : [{ title: "PC Game", platform: "Rakexura Games", quantity: 1, price: Number(order.total_price || 0) }],
      userId: order.user_id,
    };

    const text = makeCustomerInvoiceMessage(orderNotice);
    const html = makeEpicReceiptHtml({ order: orderNotice, isAdmin: false });

    const emailResult = await sendEmail({
      to: targetEmail,
      subject: `Rakexura Store Receipt - Order ${order.order_reference}`,
      text,
      html,
    });

    if (!emailResult.ok) {
      console.warn("Invoice email dispatch result:", emailResult);
    }

    // Non-blocking: update customer_email on the order if not already populated
    if (!order.customer_email) {
      void supabase
        .from("orders")
        .update({ customer_email: targetEmail })
        .eq("id", order.id);
    }

    return NextResponse.json({
      success: true,
      message: `Official invoice receipt emailed to ${targetEmail}!`,
    });
  } catch (error) {
    console.error("Error in invoice dispatch route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to dispatch invoice email.",
      },
      { status: 500 }
    );
  }
}
