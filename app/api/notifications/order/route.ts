import { rateLimiter } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { runBackgroundJob } from "@/lib/security/queue";

export const runtime = "nodejs";

type OrderNoticeItem = {
  title?: string;
  platform?: string;
  quantity?: number;
  price?: number;
};

type OrderNotice = {
  reference?: string;
  customerName?: string;
  customerWhatsApp?: string;
  customerEmail?: string;
  total?: number;
  items?: OrderNoticeItem[];
  userId?: string;
};

function price(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

function orderTotal(order: OrderNotice) {
  const directTotal = Number(order.total ?? 0);
  if (directTotal > 0) return directTotal;

  return (order.items ?? []).reduce((sum, item) => {
    const quantity = Number(item.quantity ?? 1);
    const itemPrice = Number(item.price ?? 0);
    return sum + quantity * itemPrice;
  }, 0);
}

function makeOwnerMessage(order: OrderNotice) {
  const items = order.items?.length
    ? order.items.map((item) => {
        const title = item.title ?? "Game";
        const platform = item.platform ? ` (${item.platform})` : "";
        const quantity = item.quantity ?? 1;
        const itemPrice = Number(item.price ?? 0);
        return `- ${title}${platform} x${quantity}${itemPrice ? ` - Rs. ${price(itemPrice)}` : ""}`;
      })
    : ["- Order item"];

  return [
    `New Rakexura order ${order.reference ?? ""}`.trim(),
    `Customer: ${order.customerName ?? "Customer"}`,
    order.customerEmail ? `Email: ${order.customerEmail}` : "",
    order.customerWhatsApp ? `WhatsApp: ${order.customerWhatsApp}` : "",
    `Amount: Rs. ${price(orderTotal(order))}`,
    "",
    "Items:",
    ...items,
    "",
    "Payment proof uploaded. Please verify and deliver from the admin panel.",
  ]
    .filter(Boolean)
    .join("\n");
}

function makeCustomerInvoiceMessage(order: OrderNotice) {
  const items = order.items?.length
    ? order.items.map((item) => {
        const title = item.title ?? "Game";
        const platform = item.platform ? ` (${item.platform})` : "";
        const quantity = item.quantity ?? 1;
        const itemPrice = Number(item.price ?? 0);
        return `- ${title}${platform} x${quantity}${itemPrice ? ` - Rs. ${price(itemPrice)}` : ""}`;
      })
    : ["- Order item"];

  return [
    `Thank you for your order at Rakexura Store!`,
    "",
    `Order Reference: ${order.reference ?? ""}`.trim(),
    `Customer Name: ${order.customerName ?? "Customer"}`,
    `Amount Paid: Rs. ${price(orderTotal(order))}`,
    "",
    "Items Purchased:",
    ...items,
    "",
    "Your payment proof has been received and is under review. Our team will verify it shortly and send your activation details via WhatsApp.",
    "If you have any questions, feel free to contact us on WhatsApp.",
  ]
    .filter(Boolean)
    .join("\n");
}

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

    const order = (await request.json().catch(() => ({}))) as OrderNotice;
    const message = makeOwnerMessage(order);

    runBackgroundJob(async () => {
      // 1. Send notification email to the owner
      try {
        await sendEmail({
          to: process.env.OWNER_EMAIL ?? process.env.NEXT_PUBLIC_OWNER_EMAIL,
          subject: `New Rakexura order ${order.reference ?? ""}`.trim(),
          text: message,
        });
      } catch (err) {
        console.error("Failed to send owner notification email:", err);
      }

      // 2. Send invoice email to the customer
      if (order.customerEmail) {
        try {
          const customerMessage = makeCustomerInvoiceMessage(order);
          await sendEmail({
            to: order.customerEmail,
            subject: `Rakexura Store Invoice - Order ${order.reference ?? ""}`.trim(),
            text: customerMessage,
          });
        } catch (custEmailError) {
          console.error("Failed to send invoice email to customer:", custEmailError);
        }
      }

      // 2.5 Also send push notification and database notification as customer invoice fallback
      if (order.userId) {
        try {
          const supabase = await createClient();
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
          const text = `🛒 *New Rakexura Order Received!*\n\n` +
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
            `Thank you for ordering with *Rakexura Store*! 🎮\n\n` +
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
        const supabase = await createClient();
        const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
        if (admins && admins.length > 0) {
          const adminNotifs = admins.map((admin) => ({
            user_id: admin.id,
            title: `New Order Placed`,
            message: `Order ${order.reference ?? ""} placed by ${order.customerName ?? "Customer"} for Rs. ${Number(orderTotal(order)).toLocaleString("en-IN")}.`,
            type: "order",
            link: `/admin/orders`,
          }));
          await supabase.from("notifications").insert(adminNotifs);
          await Promise.all(
            adminNotifs.map((n) => sendPushNotification(n.user_id, n.title, n.message, n.link))
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
