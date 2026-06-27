import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

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

export async function POST(request: Request) {
  try {
    const order = (await request.json().catch(() => ({}))) as OrderNotice;
    const message = makeOwnerMessage(order);

    const email = await sendEmail({
      to: process.env.OWNER_EMAIL ?? process.env.NEXT_PUBLIC_OWNER_EMAIL,
      subject: `New Rakexura order ${order.reference ?? ""}`.trim(),
      text: message,
    });

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

    return NextResponse.json({ success: true, ok: true, email }, { status: 200 });
  } catch (error) {
    console.error("Error in order notification route:", error);
    return NextResponse.json({ success: true, ok: true, error: error instanceof Error ? error.message : String(error) }, { status: 200 });
  }
}
