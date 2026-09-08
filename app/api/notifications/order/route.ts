import { rateLimiter } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { runBackgroundJob } from "@/lib/security/queue";
import { OWNER_EMAIL } from "@/lib/config";

export const runtime = "nodejs";

import {
  type OrderNotice,
  price,
  orderTotal,
  makeOwnerMessage,
  makeCustomerInvoiceMessage,
  makeEpicReceiptHtml,
} from "@/lib/receipt-template";
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateLimitKey = "rate-limit:notifications-order:" + ip;
    const limitRes = await rateLimiter.limit(rateLimitKey, 5, 60);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limitRes.reset - Math.floor(Date.now() / 1000))) } }
      );
    }

    const rawOrder = (await request.json().catch(() => ({}))) as OrderNotice;
    const isGiftOrder = Boolean(
      rawOrder.isGift ||
      (rawOrder.reference && (rawOrder.reference.toUpperCase().includes("GIFT") || rawOrder.reference.toUpperCase().includes("GIVEAWAY"))) ||
      Number(rawOrder.total ?? 0) === 0
    );
    const order: OrderNotice = {
      ...rawOrder,
      isGift: isGiftOrder,
      isPaid: rawOrder.isPaid ?? true,
      paymentStatus: rawOrder.paymentStatus || (isGiftOrder ? "Gift" : "Paid & Verified"),
    };
    const message = makeOwnerMessage(order);

    runBackgroundJob(async () => {
      // 1. Send notification email to the owner with Epic Games style HTML receipt
      const ownerEmail = OWNER_EMAIL;
      try {
        await sendEmail({
          to: ownerEmail,
          subject: `New Rakexura order ${order.reference ?? ""}`.trim(),
          text: message,
          html: makeEpicReceiptHtml({ order, isAdmin: true }),
        });
      } catch (err) {
        console.error("Failed to send owner notification email:", err);
      }

      // 2. Send invoice email to the customer with Epic Games style HTML receipt
      if (order.customerEmail) {
        try {
          const customerMessage = makeCustomerInvoiceMessage(order);
          await sendEmail({
            to: order.customerEmail,
            subject: `Rakexura Store Receipt - Order ${order.reference ?? ""}`.trim(),
            text: customerMessage,
            html: makeEpicReceiptHtml({ order, isAdmin: false }),
          });
        } catch (custEmailError) {
          console.error("Failed to send invoice email to customer:", custEmailError);
        }
      }

      // 2.5 Also send push notification and database notification as customer invoice fallback
      if (order.userId) {
        try {
          const supabase = createAdminClient();
          const customerMessage = makeCustomerInvoiceMessage(order);
          const title = `Order Placed: ${order.reference ?? ""}`;
          
          await supabase.from("notifications").insert({
            user_id: order.userId,
            title: title,
            message: customerMessage,
            type: "order",
            link: "/dashboard/orders",
          });

          await sendPushNotification(order.userId, title, customerMessage, "/dashboard/orders");
        } catch (custPushError) {
          console.error("Failed to send customer push invoice:", custPushError);
        }
      }

      // 3. Send WhatsApp (SMS) notifications
      try {
        const ownerWhatsApp = process.env.OWNER_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
        if (ownerWhatsApp) {
          const itemsList = order.items?.map(i => `${i.title} (${i.platform || 'Steam'}) x${i.quantity ?? 1}`).join(', ') || 'Game';
          const text = `*New Rakexura Order Received!*\n\n` +
            `• *Reference:* ${order.reference ?? "N/A"}\n` +
            `• *Customer:* ${order.customerName ?? "Customer"}\n` +
            `• *WhatsApp:* ${order.customerWhatsApp ?? "N/A"}\n` +
            `• *Email:* ${order.customerEmail ?? "N/A"}\n` +
            `• *Total:* Rs. ${price(orderTotal(order))}\n` +
            `• *Items:* ${itemsList}\n\n` +
            `Please verify the payment proof and deliver from the admin dashboard.`;
          await sendWhatsAppText(ownerWhatsApp, text);
        }
      } catch (waOwnerError) {
        console.error("Failed to send WhatsApp notification to owner:", waOwnerError);
      }

      try {
        if (order.customerWhatsApp) {
          const text = `Hello ${order.customerName ?? 'Customer'},\n\n` +
            `Thank you for ordering with *Rakexura Store*!\n\n` +
            `• *Order Reference:* ${order.reference ?? "N/A"}\n` +
            `• *Total Amount:* Rs. ${price(orderTotal(order))}\n\n` +
            `We have received your payment proof. Our team is verifying it right now. Once verified, your activation details will be delivered directly here!\n\n` +
            `Have a great day!`;
          await sendWhatsAppText(order.customerWhatsApp, text);
        }
      } catch (waCustError) {
        console.error("Failed to send WhatsApp notification to customer:", waCustError);
      }

      // 4. Send database in-app & push notification to admins
      try {
        const supabase = createAdminClient();
        let adminIds: string[] = [];
        const { data: rpcAdmins } = await supabase.rpc("get_admin_user_ids" as never);
        if (rpcAdmins && Array.isArray(rpcAdmins) && rpcAdmins.length > 0) {
          adminIds = (rpcAdmins as Array<{ id: string }>).map((a) => a.id);
        } else {
          const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
          if (admins && admins.length > 0) {
            adminIds = admins.map((a) => a.id);
          }
        }

        if (adminIds.length > 0) {
          const adminNotifs = adminIds.map((adminId) => ({
            user_id: adminId,
            title: `New Order Placed`,
            message: `Order ${order.reference ?? ""} placed by ${order.customerName ?? "Customer"} for Rs. ${Number(orderTotal(order)).toLocaleString("en-IN")}.`,
            type: "order",
            link: `/admin/orders`,
          }));
          await supabase.from("notifications").insert(adminNotifs);
          await Promise.all(
            adminIds.map((adminId) =>
              sendPushNotification(
                adminId,
                `New Order: ${order.reference ?? ""}`,
                `Order ${order.reference ?? ""} placed by ${order.customerName ?? "Customer"} for Rs. ${Number(orderTotal(order)).toLocaleString("en-IN")}.`,
                `/admin/orders`
              )
            )
          );
        }
      } catch (dbError) {
        console.error("Failed to insert admin order notification into Supabase:", dbError);
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ok: true
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in order notification route:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: "ORDER_NOTIFICATION_FAILED"
        }
      },
      { status: 500 }
    );
  }
}
