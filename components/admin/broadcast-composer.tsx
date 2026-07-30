"use client";

import { BellRing, Gamepad2, Gift, MessageCircle, Send, Mail, Flame, Key, Megaphone, LifeBuoy, Sparkles, Receipt, Search, Star, Clock } from "lucide-react";
import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import { sendStoreAnnouncement, sendSinglePushNotification, sendSingleEmailNotification, giftGameToCustomer, fetchOrderInvoiceData } from "@/app/admin/actions";
import { CustomSelect } from "@/components/common/custom-select";
import { gameUrl } from "@/lib/utils";

type Customer = { id: string; display_name: string | null; whatsapp: string | null; email?: string | null };
type GameOption = {
  id: number;
  title: string;
  slug?: string | null;
  cover_url?: string | null;
  banner_url?: string | null;
  sale_price?: number | null;
  original_price?: number | null;
  offline_price?: number | null;
  steam_price?: number | null;
  discount_percent?: number | null;
};
export type OrderOption = {
  id: number;
  order_reference: string | null;
  user_id: string | null;
  game_id: number | null;
  variant_type: string | null;
  total_price: number | null;
  cart_items: unknown;
  customer_name: string | null;
  customer_whatsapp: string | null;
  account_access: string | null;
  order_status: string | null;
  created_at: string;
};

const templates = {
  invoice: {
    label: "Order Invoice",
    icon: Receipt,
    title: "Invoice ID: RKX-ORDER-REF",
    message:
      "Thank You.\n\n" +
      "Thank you for your purchase!\n\n" +
      "INVOICE ID:\nRKX-ORDER-REF\n\n" +
      "YOUR ORDER INFORMATION:\n" +
      "• Order ID: RKX-ORDER-REF\n" +
      "• Source: Rakexura Store\n\n" +
      "HERE'S WHAT YOU ORDERED:\n" +
      "• Purchased Items\n\n" +
      "Please keep a copy of this receipt for your records.\n" +
      "View your purchase history: https://rakexura-store.vercel.app/dashboard/orders",
    shortMessage: "Invoice RKX-ORDER-REF processed! View receipt details.",
    link: "/dashboard/orders",
  },
  review: {
    label: "Review Request",
    icon: Star,
    title: "How was your gaming experience? Leave a review!",
    message: "Thank you for shopping at Rakexura Store! We hope you are enjoying your new game. Please take 30 seconds to rate your experience and leave a review. Your feedback helps fellow gamers!",
    shortMessage: "Leave a review on Rakexura Store! Share your gaming experience.",
    link: "/dashboard/orders",
  },
  game: {
    label: "New Game",
    icon: Gamepad2,
    title: "New game added",
    message: "A new game just landed at Rakexura. View the latest price and available platforms now.",
    shortMessage: "New Game added to Rakexura Store catalog!",
    link: "/games",
  },
  preorder: {
    label: "Pre-order Game",
    icon: Clock,
    title: "Pre-order Live on Rakexura Store",
    message: "Pre-orders are now officially open! Reserve your copy today on Rakexura Store to secure day-1 activation access and exclusive perks.",
    shortMessage: "Pre-order Live: Reserve your copy on Rakexura Store now!",
    link: "/games",
  },
  offer: {
    label: "Special Offer",
    icon: Flame,
    title: "Special Offer Live on Rakexura Store",
    message: "A fresh limited-time special offer is live! Check out our exclusive discounts on top PC games and grab your keys before stock runs out.",
    shortMessage: "Special Offer: Top PC game deals live on Rakexura Store now!",
    link: "/games",
  },
  giveaway: {
    label: "Giveaway Alert",
    icon: Gift,
    title: "Rakexura Free Game Giveaway",
    message: "A new Rakexura giveaway is open. Check the details and join before entries close.",
    shortMessage: "Giveaway Alert: Win a free game on Rakexura Store!",
    link: "/",
  },
  activation: {
    label: "Activation Guide",
    icon: Key,
    title: "Game Activation & Account Guide",
    message: "Your game activation instructions and account details are ready. View your orders to claim access.",
    shortMessage: "Activation Guide: Claim your game access now.",
    link: "/dashboard/orders",
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    title: "Important Rakexura Store Update",
    message: "We have updated our store catalog and platform options. Discover what's new today on Rakexura!",
    shortMessage: "Announcement: New store features updated on Rakexura!",
    link: "/",
  },
  support: {
    label: "Support Notice",
    icon: LifeBuoy,
    title: "Rakexura Support Update",
    message: "Need activation help or order assistance? Our support desk is ready to help you.",
    shortMessage: "Support Notice: Need help with your order? Contact support.",
    link: "/support",
  },
};

export function BroadcastComposer({
  customers,
  games,
  orders = [],
  prefill,
}: {
  customers: Customer[];
  games: GameOption[];
  orders?: OrderOption[];
  prefill?: string;
}) {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("game");
  const [title, setTitle] = useState(prefill ? `${prefill} is now available` : templates.game.title);
  const [message, setMessage] = useState(prefill ? `${prefill} has arrived at Rakexura. Check platforms, live pricing, trailers, and current offers.` : templates.game.message);
  const [shortMessage, setShortMessage] = useState(prefill ? `🎮 New Game: ${prefill} is now live on Rakexura!` : templates.game.shortMessage);
  const [link, setLink] = useState(prefill ? `/games` : templates.game.link);
  const [whatsappChannelLink, setWhatsappChannelLink] = useState(
    process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || "https://whatsapp.com/channel/0029Vb4w"
  );
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [targetEmail, setTargetEmail] = useState(customers[0]?.email ?? "");
  const [giftGameId, setGiftGameId] = useState("");
  const [giftPlatform, setGiftPlatform] = useState("Steam");
  const [giftPending, setGiftPending] = useState(false);
  const [emailPending, setEmailPending] = useState(false);
  const [pushPending, setPushPending] = useState(false);
  const [comboPending, setComboPending] = useState(false);
  const [pending, startTransition] = useTransition();

  const [orderQueryInput, setOrderQueryInput] = useState("");
  const [fetchingOrder, setFetchingOrder] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const customer = customers.find((item) => item.id === customerId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (customer?.email) {
      setTargetEmail(customer.email);
    }
  }, [customerId, customer]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(600, Math.max(180, textareaRef.current.scrollHeight + 8))}px`;
    }
  }, [message]);

  function parseOrderItemsInClient(raw: unknown, fallbackGameId?: number | null, fallbackPlatform?: string | null, fallbackPrice?: number | null) {
    let source = raw;
    if (typeof source === "string") {
      try { source = JSON.parse(source); } catch { source = []; }
    }
    const entries = Array.isArray(source) ? source : [];
    const items = entries.map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      return {
        title: String(item.title ?? item.name ?? "Game order"),
        platform: typeof item.platform === "string" ? item.platform : typeof item.variant_type === "string" ? item.variant_type : undefined,
        quantity: Math.max(1, Number(item.quantity ?? 1) || 1),
        price: Number(item.unit_price ?? item.price ?? item.sale_price ?? item.total ?? 0) || 0,
      };
    }).filter(Boolean) as Array<{ title: string; platform?: string; quantity: number; price: number }>;

    if (items.length) return items;
    return [{ title: "Game order", platform: fallbackPlatform || undefined, quantity: 1, price: fallbackPrice || 0 }];
  }

  function applyInvoiceFromData(data: {
    orderRef: string;
    items: string;
    totalPrice: number;
    status: string | null;
    accountAccess?: string | null;
    userId?: string | null;
    customerEmail?: string | null;
    customerWhatsapp?: string | null;
  }) {
    setSelectedTemplateKey("invoice");
    const ref = data.orderRef;
    const itemsText = data.items || "Purchased Items";
    const amountStr = `₹${Number(data.totalPrice ?? 0).toLocaleString("en-IN")}`;
    const todayDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    setTitle(`Invoice ID: ${ref}`);
    setMessage(
      `Thank You.\n\n` +
      `Hi ${data.customerEmail ? data.customerEmail.split("@")[0] : 'Customer'}!\n` +
      `Thank you for your purchase!\n\n` +
      `INVOICE ID:\n${ref}\n\n` +
      `YOUR ORDER INFORMATION:\n` +
      `• Order ID: ${ref}\n` +
      `• Order Date: ${todayDate}\n` +
      `• Source: Rakexura Store\n\n` +
      `HERE'S WHAT YOU ORDERED:\n` +
      `• ${itemsText} - ${amountStr} INR\n\n` +
      `TOTAL: ${amountStr} INR\n\n` +
      `Please keep a copy of this receipt for your records.\n` +
      `View your purchase history: https://rakexura-store.vercel.app/dashboard/orders`
    );
    setLink(`/track-order?order=${encodeURIComponent(ref)}`);

    let foundCustomer = customers.find((c) => data.userId && c.id === data.userId);
    if (!foundCustomer && data.customerEmail) {
      foundCustomer = customers.find((c) => c.email?.toLowerCase() === data.customerEmail?.toLowerCase());
    }
    if (!foundCustomer && data.customerWhatsapp) {
      const cleanWA = data.customerWhatsapp.replace(/\D/g, "");
      foundCustomer = customers.find((c) => c.whatsapp?.replace(/\D/g, "") === cleanWA);
    }

    if (foundCustomer) {
      setCustomerId(foundCustomer.id);
      if (foundCustomer.email) setTargetEmail(foundCustomer.email);
      toast.success(`Loaded invoice for ${ref} (${foundCustomer.display_name || foundCustomer.email})!`);
    } else if (data.customerEmail) {
      setTargetEmail(data.customerEmail);
      toast.success(`Loaded invoice for ${ref}!`);
    } else {
      toast.success(`Loaded invoice for ${ref}!`);
    }
  }

  function selectOrderById(idStr: string) {
    setSelectedOrderId(idStr);
    if (!idStr) return;
    const foundOrder = orders.find((o) => String(o.id) === idStr);
    if (!foundOrder) return;

    const items = parseOrderItemsInClient(foundOrder.cart_items, foundOrder.game_id, foundOrder.variant_type, foundOrder.total_price);
    const itemSummary = items.map((i) => `${i.title}${i.platform ? ` (${i.platform})` : ""} x${i.quantity}`).join(", ");
    const orderRef = foundOrder.order_reference || `#${foundOrder.id}`;

    applyInvoiceFromData({
      orderRef,
      items: itemSummary,
      totalPrice: foundOrder.total_price ?? 0,
      status: foundOrder.order_status,
      accountAccess: foundOrder.account_access,
      userId: foundOrder.user_id,
      customerWhatsapp: foundOrder.customer_whatsapp,
    });
  }

  async function handleFetchOrderNo() {
    if (!orderQueryInput.trim()) return toast.error("Enter an Order Ref or ID");
    setFetchingOrder(true);
    try {
      const res = await fetchOrderInvoiceData(orderQueryInput);
      applyInvoiceFromData(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order not found");
    } finally {
      setFetchingOrder(false);
    }
  }

  async function sendGiftGame() {
    if (!customerId) return toast.error("Select a customer first");
    if (!giftGameId) return toast.error("Select a game to gift");
    setGiftPending(true);
    try {
      const data = new FormData();
      data.set("userId", customerId);
      data.set("gameId", giftGameId);
      data.set("platform", giftPlatform);
      const result = await giftGameToCustomer(data);
      if (result.success) {
        toast.success(`Game gifted successfully as a giveaway! Ref: ${result.orderRef}`);
        setGiftGameId("");
      } else {
        toast.error(result.error || "Failed to gift game");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to gift game");
    } finally {
      setGiftPending(false);
    }
  }

  function applyTemplate(key: string) {
    setSelectedTemplateKey(key);
    const template = templates[key as keyof typeof templates];
    const game = games.find((item) => item.id === Number(selectedGameId));

    if (key === "offer") {
      if (game) {
        const salePrice = game.sale_price || game.offline_price || game.steam_price || 0;
        const origPrice = game.original_price || (salePrice ? Math.round(salePrice * 1.3) : 0);
        const discount = game.discount_percent || (origPrice && salePrice ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 30);
        const priceStr = salePrice ? `₹${salePrice.toLocaleString("en-IN")}` : "Special Price";
        const origStr = origPrice ? `₹${origPrice.toLocaleString("en-IN")}` : "";

        setTitle(`Limited Time Deal: ${game.title} is on Sale!`);
        setMessage(
          `Exclusive Special Offer on ${game.title}!\n\n` +
          `Grab your copy now for only ${priceStr}${origStr ? ` (was ${origStr}, save ${discount}% OFF)` : ''}.\n\n` +
          `Limited stock available on Rakexura Store. Claim your key before the deal ends!`
        );
        setShortMessage(`Special Offer: ${game.title} is ${discount}% OFF at ${priceStr}! Grab it now.`);
        setLink(gameUrl(game));
      } else {
        setTitle("Exclusive Rakexura Offer Live");
        setMessage("A fresh limited-time special offer is live! Check out our exclusive discounts on top PC games and grab your keys before stock runs out.");
        setShortMessage("Special Offer: Top PC game deals live on Rakexura Store now!");
        setLink("/games");
      }
    } else if (key === "preorder") {
      if (game) {
        const salePrice = game.sale_price || game.offline_price || game.steam_price || 0;
        const priceStr = salePrice ? `₹${salePrice.toLocaleString("en-IN")}` : "Special Price";

        setTitle(`Pre-order Live: ${game.title}`);
        setMessage(
          `Pre-orders are officially open for ${game.title}!\n\n` +
          `Reserve your copy today on Rakexura Store${priceStr !== "Special Price" ? ` (from ${priceStr})` : ''} to secure day-1 activation access and exclusive pre-order perks.`
        );
        setShortMessage(`Pre-order Live: Secure your copy of ${game.title} on Rakexura Store now!`);
        setLink(gameUrl(game));
      } else {
        setTitle(template.title);
        setMessage(template.message);
        setShortMessage(template.shortMessage || template.title);
        setLink(template.link);
      }
    } else {
      setTitle(template.title);
      setMessage(template.message);
      setShortMessage(template.shortMessage || template.title);
      setLink(template.link);
    }
  }

  function chooseGame(id: string) {
    const game = games.find((item) => item.id === Number(id));
    if (!game) return;
    setSelectedGameId(id);

    const salePrice = game.sale_price || game.offline_price || game.steam_price || 0;
    const origPrice = game.original_price || (salePrice ? Math.round(salePrice * 1.3) : 0);
    const discount = game.discount_percent || (origPrice && salePrice ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 30);
    const priceStr = salePrice ? `₹${salePrice.toLocaleString("en-IN")}` : "Special Price";
    const origStr = origPrice ? `₹${origPrice.toLocaleString("en-IN")}` : "";

    if (selectedTemplateKey === "offer") {
      setTitle(`Limited Time Deal: ${game.title} is on Sale!`);
      setMessage(
        `Exclusive Special Offer on ${game.title}!\n\n` +
        `Grab your copy now for only ${priceStr}${origStr ? ` (was ${origStr}, save ${discount}% OFF)` : ''}.\n\n` +
        `Limited stock available on Rakexura Store. Claim your key before the deal ends!`
      );
      setShortMessage(`Special Offer: ${game.title} is ${discount}% OFF at ${priceStr}! Grab it now.`);
      setLink(gameUrl(game));
    } else if (selectedTemplateKey === "preorder") {
      setTitle(`Pre-order Live: ${game.title}`);
      setMessage(
        `Pre-orders are officially open for ${game.title}!\n\n` +
        `Reserve your copy today on Rakexura Store${priceStr !== "Special Price" ? ` (from ${priceStr})` : ''} to secure day-1 activation access and exclusive pre-order perks.`
      );
      setShortMessage(`Pre-order Live: Secure your copy of ${game.title} on Rakexura Store now!`);
      setLink(gameUrl(game));
    } else if (selectedTemplateKey === "review") {
      setTitle(`How is ${game.title}? Leave a review!`);
      setMessage(`Hope you are enjoying ${game.title}! Please take 30 seconds to rate your experience and leave a review on Rakexura Store.`);
      setShortMessage(`Leave a review for ${game.title}! Share your experience.`);
      setLink(gameUrl(game));
    } else {
      setTitle(`${game.title} is now available`);
      setMessage(`${game.title} has arrived at Rakexura. Check platforms, live pricing${priceStr !== "Special Price" ? ` (from ${priceStr})` : ''}, trailers, and current offers.`);
      setShortMessage(`New Game: ${game.title} is now live on Rakexura Store!`);
      setLink(gameUrl(game));
    }
  }

  function notifyAll() {
    const data = new FormData();
    data.set("title", title);
    data.set("message", message);
    data.set("shortMessage", shortMessage);
    data.set("link", link);
    if (selectedGameId) data.set("gameId", selectedGameId);
    startTransition(async () => {
      try {
        const result = await sendStoreAnnouncement(data);
        toast.success(`Broadcast sent to ${result.count} customer accounts (In-App, Push & Email)!`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not send announcement");
      }
    });
  }

  async function sendPushToCustomer() {
    if (!customerId) return toast.error("Select a customer first");
    setPushPending(true);
    try {
      const data = new FormData();
      data.set("userId", customerId);
      data.set("title", title);
      data.set("message", message);
      data.set("shortMessage", shortMessage);
      data.set("link", link);
      if (selectedGameId) data.set("gameId", selectedGameId);
      const result = await sendSinglePushNotification(data);
      if (result.sentCount > 0) {
        toast.success(`Push notification sent to ${result.sentCount} device(s)!`);
      } else {
        toast.warning("Notification saved in-app, but customer has no registered browser push subscription.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send push notification");
    } finally {
      setPushPending(false);
    }
  }

  async function sendEmailToCustomer() {
    if (!targetEmail.trim()) return toast.error("Select a customer email address");
    setEmailPending(true);
    try {
      const data = new FormData();
      data.set("userId", customerId);
      data.set("email", targetEmail.trim());
      data.set("title", title);
      data.set("message", message);
      data.set("link", link);
      if (selectedGameId) data.set("gameId", selectedGameId);
      const result = await sendSingleEmailNotification(data);
      toast.success(`Email successfully sent to ${result.recipient}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email notification");
    } finally {
      setEmailPending(false);
    }
  }

  async function sendComboToCustomer() {
    if (!customerId && !targetEmail) return toast.error("Select a customer email");
    setComboPending(true);
    let emailStatus = false;
    let pushStatus = false;
    let emailErr = "";

    try {
      if (targetEmail.trim()) {
        const data = new FormData();
        data.set("userId", customerId);
        data.set("email", targetEmail.trim());
        data.set("title", title);
        data.set("message", message);
        data.set("link", link);
        await sendSingleEmailNotification(data);
        emailStatus = true;
      }
    } catch (e) {
      emailErr = e instanceof Error ? e.message : "Email dispatch failed";
      console.warn("Combo email dispatch failed:", e);
    }

    try {
      if (customerId) {
        const data = new FormData();
        data.set("userId", customerId);
        data.set("title", title);
        data.set("message", message);
        data.set("link", link);
        const pRes = await sendSinglePushNotification(data);
        if (pRes?.sentCount && pRes.sentCount > 0) pushStatus = true;
      }
    } catch (e) {
      console.warn("Combo push dispatch failed:", e);
    }

    setComboPending(false);
    if (emailStatus) {
      toast.success(`Email sent to ${targetEmail.trim()}! ${pushStatus ? "(Push sent)" : "(Device push skipped - no active push token)"}`);
    } else if (pushStatus) {
      toast.success("Device push notification delivered successfully!");
    } else {
      toast.error(emailErr || "Failed to send notification. Check customer email address.");
    }
  }

  function openWhatsApp() {
    if (!customer?.whatsapp) return toast.error("This customer has no saved WhatsApp number");
    const phone = customer.whatsapp.replace(/\D/g, "");
    const normalized = phone.length === 10 ? `91${phone}` : phone;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(`${title}\n\n${message}\n\n${location.origin}${link}`)}`, "_blank", "noopener,noreferrer");
  }

  async function shareToWhatsAppChannel() {
    const selectedGame = games.find((g) => String(g.id) === selectedGameId);
    const imageUrl = selectedGame?.cover_url || selectedGame?.banner_url || "";

    let waText = `*${title.toUpperCase()}*\n\n`;
    if (imageUrl) {
      waText += `📸 *GAME PHOTO:* ${imageUrl}\n\n`;
    }
    waText += `${message}\n\n`;
    waText += `🎮 *ORDER GAME HERE:* ${location.origin}${link}`;
    if (whatsappChannelLink) {
      waText += `\n\n📢 *JOIN RAKEXURA WHATSAPP CHANNEL:* ${whatsappChannelLink}`;
    }

    try {
      await navigator.clipboard.writeText(waText);
      toast.success("Pre-built message & game photo copied to clipboard! Opening WhatsApp...");
    } catch {
      toast.info("Opening WhatsApp...");
    }

    const encodedText = encodeURIComponent(waText);
    const targetUrl = `https://web.whatsapp.com/send?text=${encodedText}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  const safeGames = (games ?? []).filter((g) => Boolean(g && g.id));
  const safeCustomers = (customers ?? []).filter((c) => Boolean(c && c.id));
  const safeOrders = (orders ?? []).filter((o) => Boolean(o && o.id));

  const gameOptions = [
    { value: "", label: "Custom announcement" },
    ...safeGames.map((g) => ({ value: String(g.id), label: g.title || "Game" })),
  ];

  const customerOptions = [
    { value: "", label: "Select registered customer account" },
    ...safeCustomers.map((c) => ({
      value: String(c.id),
      label: c.display_name || c.email?.split("@")[0] || c.email || "Customer",
      sublabel: c.email ? `Email: ${c.email}${c.whatsapp ? ` · WA: ${c.whatsapp}` : ''}` : `${c.whatsapp ? `WA: ${c.whatsapp}` : 'Registered Account'}`,
    })),
  ];

  const giftGameOptions = [
    { value: "", label: "Choose game to gift" },
    ...safeGames.map((g) => ({ value: String(g.id), label: g.title || "Game" })),
  ];

  const platformOptions = [
    { value: "Steam", label: "Steam" },
    { value: "Epic", label: "Epic" },
    { value: "Offline", label: "Offline" },
    { value: "Xbox", label: "Xbox" },
    { value: "Nvidia GeForce", label: "Nvidia GeForce" },
  ];

  const [selectedGameId, setSelectedGameId] = useState("");

  const templateSelectOptions = [
    { value: "game", label: "New Game", sublabel: "Announce new game added to store catalog", icon: Gamepad2 },
    { value: "preorder", label: "Pre-order Game", sublabel: "Announce upcoming pre-order availability & perks", icon: Clock },
    { value: "offer", label: "Special Offer", sublabel: "Promote limited-time discounts & sale pricing", icon: Flame },
    { value: "invoice", label: "Order Invoice", sublabel: "Fetch & send purchase receipt to customer", icon: Receipt },
    { value: "review", label: "Review Request", sublabel: "Ask customer to leave a review & rating", icon: Star },
    { value: "giveaway", label: "Giveaway Alert", sublabel: "Announce free game giveaway or gift", icon: Gift },
    { value: "activation", label: "Activation Guide", sublabel: "Send game activation & account instructions", icon: Key },
    { value: "announcement", label: "Announcement", sublabel: "General store feature or platform update", icon: Megaphone },
    { value: "support", label: "Support Notice", sublabel: "Send support desk & order help update", icon: LifeBuoy },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="premium-panel rounded-lg p-5 md:p-7">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#b9a4ff] shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <BellRing size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Create an update</h2>
            <p className="text-sm text-[#8991a6]">Send a safe in-app, push, or email notification to registered customers.</p>
          </div>
        </div>

        {/* Quick Template Dropdown */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#94a3b8] mb-2.5">
            <Sparkles size={15} className="text-[#a78bfa]" />
            <span>SELECT NOTIFICATION TEMPLATE</span>
          </div>
          <CustomSelect
            options={templateSelectOptions}
            value={selectedTemplateKey}
            onChange={(val) => applyTemplate(val)}
            placeholder="Select a notification template..."
            searchable={false}
          />
        </div>

        {/* Order Invoice Fetch & Auto-Fill Section */}
        <div className="mt-5 rounded-lg border border-[#facc15]/30 bg-[#facc15]/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#facc15]">
            <Receipt size={16} />
            <span>FETCH ORDER & AUTO-FILL INVOICE</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {/* Pick Recent Order */}
            <div>
              <label className="block text-xs font-bold text-[#8991a8] mb-1.5">Pick Recent Order</label>
              <CustomSelect
                options={[
                  { value: "", label: "Pick recent order..." },
                  ...safeOrders.map((o) => ({
                    value: String(o.id),
                    label: `${o.order_reference || `#${o.id}`} - Rs. ${Number(o.total_price ?? 0).toLocaleString("en-IN")}`,
                    sublabel: `${o.customer_name || 'Customer'} · Status: ${o.order_status || 'Pending'}`,
                  })),
                ]}
                value={selectedOrderId}
                onChange={(val) => selectOrderById(val)}
                placeholder="Pick recent order..."
              />
            </div>

            {/* Search Order No / Reference */}
            <div>
              <label className="block text-xs font-bold text-[#8991a8] mb-1.5">Search Order No / Ref</label>
              <div className="flex gap-2">
                <input
                  value={orderQueryInput}
                  onChange={(e) => setOrderQueryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleFetchOrderNo(); }}
                  placeholder="e.g. RKX-2607-000064 or 64"
                  className="h-10 flex-1 rounded-md border border-white/10 bg-black/30 px-3 text-xs font-mono text-white outline-none focus:border-[#facc15]"
                />
                <button
                  type="button"
                  onClick={handleFetchOrderNo}
                  disabled={fetchingOrder}
                  className="btn bg-[#facc15] hover:bg-[#eab308] text-black h-10 px-4 text-xs font-extrabold cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Search size={14} />
                  {fetchingOrder ? "Fetching..." : "Fetch"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 block text-sm font-bold">
          Choose a game <span className="font-normal text-[#8991a6]">(optional)</span>
          <div className="mt-2">
            <CustomSelect
              options={gameOptions}
              value={selectedGameId}
              onChange={(val) => {
                setSelectedGameId(val);
                chooseGame(val);
              }}
              placeholder="Custom announcement"
            />
          </div>
        </div>

        <label className="mt-4 block text-sm font-bold">
          Title / Email Subject
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 text-sm font-medium text-white outline-none focus:border-[#8b5cf6]"
          />
        </label>

        <label className="mt-4 block text-sm font-bold">
          Message Body
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onWheel={(e) => e.stopPropagation()}
            maxLength={3000}
            rows={8}
            style={{ overflowY: "auto", scrollbarWidth: "thin" }}
            className="mt-2 w-full min-h-[180px] max-h-[600px] overflow-y-auto resize-y rounded-md border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-white outline-none focus:border-[#8b5cf6]"
          />
        </label>

        <label className="mt-4 block text-sm font-bold">
          <span className="flex items-center justify-between">
            <span>Push Notification Short Message</span>
            <span className="text-[10px] font-black uppercase text-[#a78bfa] tracking-wider bg-[#a78bfa]/10 px-2 py-0.5 rounded border border-[#a78bfa]/20">Device Push Alert</span>
          </span>
          <input
            value={shortMessage}
            onChange={(event) => setShortMessage(event.target.value)}
            maxLength={120}
            placeholder="Short message for browser & mobile push notifications..."
            className="mt-2 h-11 w-full rounded-md border border-[#a78bfa]/40 bg-black/25 px-4 text-xs font-bold text-white outline-none focus:border-[#a78bfa]"
          />
        </label>

        <label className="mt-4 block text-sm font-bold">
          Rakexura Target Link
          <input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 text-sm font-medium text-white outline-none focus:border-[#8b5cf6]"
          />
        </label>

        <label className="mt-4 block text-sm font-bold text-[#20c763]">
          Rakexura WhatsApp Channel Link <span className="font-normal text-[#8991a6]">(for WhatsApp channel broadcast)</span>
          <input
            value={whatsappChannelLink}
            onChange={(event) => setWhatsappChannelLink(event.target.value)}
            placeholder="e.g. https://whatsapp.com/channel/..."
            className="mt-2 h-12 w-full rounded-md border border-[#20c763]/40 bg-black/25 px-4 text-sm font-medium text-white outline-none focus:border-[#20c763]"
          />
        </label>

        <button
          type="button"
          onClick={notifyAll}
          disabled={pending}
          className="btn btn-primary mt-6 w-full text-sm font-black cursor-pointer disabled:opacity-50"
        >
          <Send size={16} />
          <span className="font-black">{pending ? "Sending Broadcast..." : "Notify all customer accounts"}</span>
        </button>

        {/* WhatsApp Channel & Group Broadcast Button */}
        <button
          type="button"
          onClick={shareToWhatsAppChannel}
          className="btn mt-3.5 w-full bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-sm cursor-pointer flex items-center justify-center gap-2.5 py-3.5 rounded-lg shadow-[0_0_22px_rgba(37,211,102,0.35)] transition-all border border-black/10"
        >
          <MessageCircle size={20} className="text-black stroke-[2.2] shrink-0" />
          <span className="font-extrabold text-sm text-black tracking-tight">Open WhatsApp Channel Broadcast</span>
        </button>
      </section>

      <aside className="space-y-5">
        {/* Targeted Customer Communications panel */}
        <div className="premium-panel h-fit rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#20c763]/30 bg-[#20c763]/10 text-[#20c763]">
              <MessageCircle size={18} />
            </div>
            <h2 className="text-lg font-black text-white">Targeted Customer Messaging</h2>
          </div>
          <p className="text-xs leading-5 text-[#8991a6]">
            Select a registered website account to send a targeted lockscreen push, WhatsApp message, or direct email update.
          </p>

          <div>
            <label className="block text-xs font-bold text-[#8991a8] mb-1.5">Select Website Customer</label>
            <CustomSelect
              options={customerOptions}
              value={customerId}
              onChange={(val) => {
                setCustomerId(val);
                const found = customers.find((c) => c.id === val);
                if (found?.email) setTargetEmail(found.email);
              }}
              placeholder="Select registered customer..."
            />
          </div>

          <div
            style={{ overflowY: "auto", scrollbarWidth: "thin" }}
            className="max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-md border border-white/[.07] bg-black/20 p-3.5 text-xs leading-5 text-[#aab1c1]"
          >
            <strong className="block text-white font-bold">{title}</strong>
            <span className="mt-1 block text-zinc-300 whitespace-pre-wrap">{message}</span>
            {targetEmail && <span className="mt-2 block text-[11px] text-[#b9a4ff] font-mono">Recipient Email: {targetEmail}</span>}
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={sendEmailToCustomer}
              disabled={emailPending}
              className="btn w-full bg-white hover:bg-[#e4e4e7] text-black font-extrabold text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Mail size={16} /> {emailPending ? "Sending Email..." : "Send Direct Email"}
            </button>

            <button
              type="button"
              onClick={sendPushToCustomer}
              disabled={pushPending}
              className="btn w-full bg-white hover:bg-[#e4e4e7] text-black font-extrabold text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Send size={16} /> {pushPending ? "Sending Push..." : "Send Device Push"}
            </button>

            <button
              type="button"
              onClick={sendComboToCustomer}
              disabled={comboPending}
              className="btn w-full bg-white hover:bg-[#e4e4e7] text-black font-extrabold text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> {comboPending ? "Sending Combo..." : "Send Email + Device Push"}
            </button>

            <button
              type="button"
              onClick={openWhatsApp}
              className="btn w-full bg-[#20c763] hover:bg-[#1bb057] text-black font-extrabold text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} /> Open WhatsApp
            </button>
          </div>
        </div>

        {/* Giveaway / Gift Game Panel */}
        <div className="premium-panel h-fit rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#facc15]/30 bg-[#facc15]/10 text-[#facc15]">
              <Gift size={18} />
            </div>
            <h2 className="text-lg font-black text-white">Giveaway / Gift Game</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#8991a6]">Send a game directly to this customer&apos;s library and orders page at Rs. 0 as a giveaway.</p>

          <label className="mt-4 block text-xs font-bold text-[#8991a8]">Select Game</label>
          <div className="mt-1.5">
            <CustomSelect
              options={giftGameOptions}
              value={giftGameId}
              onChange={(val) => setGiftGameId(val)}
              placeholder="Choose game to gift"
            />
          </div>

          <label className="mt-4 block text-xs font-bold text-[#8991a8]">Select Platform</label>
          <div className="mt-1.5">
            <CustomSelect
              options={platformOptions}
              value={giftPlatform}
              onChange={(val) => setGiftPlatform(val)}
              placeholder="Select platform"
              searchable={false}
            />
          </div>

          <button onClick={sendGiftGame} disabled={giftPending} className="btn mt-5 w-full btn-primary bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold cursor-pointer">
            <Gift size={16} /> {giftPending ? "Gifting..." : "Gift Game"}
          </button>
        </div>
      </aside>
    </div>
  );
}
