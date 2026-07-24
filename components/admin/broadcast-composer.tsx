"use client";

import { BellRing, Gamepad2, Gift, MessageCircle, Send, Mail, Flame, Key, Megaphone, LifeBuoy, Sparkles } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { sendStoreAnnouncement, sendSinglePushNotification, sendSingleEmailNotification, giftGameToCustomer } from "@/app/admin/actions";
import { CustomSelect } from "@/components/common/custom-select";

type Customer = { id: string; display_name: string | null; whatsapp: string | null; email?: string | null };
type GameOption = { id: number; title: string };

const templates = {
  game: {
    label: "New Game",
    icon: Gamepad2,
    title: "New game added",
    message: "A new game just landed at Rakexura. View the latest price and available platforms now.",
    link: "/games",
  },
  offer: {
    label: "Special Offer",
    icon: Flame,
    title: "Exclusive Rakexura Offer Live",
    message: "A fresh limited-time offer is live. Open Rakexura Store before the deal ends.",
    link: "/games",
  },
  giveaway: {
    label: "Giveaway Alert",
    icon: Gift,
    title: "Rakexura Free Game Giveaway",
    message: "A new Rakexura giveaway is open. Check the details and join before entries close.",
    link: "/",
  },
  activation: {
    label: "Activation Guide",
    icon: Key,
    title: "Game Activation & Account Guide",
    message: "Your game activation instructions and account details are ready. View your orders to claim access.",
    link: "/dashboard/orders",
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    title: "Important Rakexura Store Update",
    message: "We have updated our store catalog and platform options. Discover what's new today on Rakexura!",
    link: "/",
  },
  support: {
    label: "Support Notice",
    icon: LifeBuoy,
    title: "Rakexura Support Update",
    message: "Need activation help or order assistance? Our support desk is ready to help you.",
    link: "/support",
  },
};

export function BroadcastComposer({ customers, games, prefill }: { customers: Customer[]; games: GameOption[]; prefill?: string }) {
  const [title, setTitle] = useState(prefill ? `${prefill} is now available` : templates.game.title);
  const [message, setMessage] = useState(prefill ? `${prefill} has arrived at Rakexura. Check platforms, live pricing, trailers, and current offers.` : templates.game.message);
  const [link, setLink] = useState(prefill ? `/games` : templates.game.link);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [targetEmail, setTargetEmail] = useState(customers[0]?.email ?? "");
  const [giftGameId, setGiftGameId] = useState("");
  const [giftPlatform, setGiftPlatform] = useState("Steam");
  const [giftPending, setGiftPending] = useState(false);
  const [emailPending, setEmailPending] = useState(false);
  const [pushPending, setPushPending] = useState(false);
  const [comboPending, setComboPending] = useState(false);
  const [pending, startTransition] = useTransition();

  const customer = customers.find((item) => item.id === customerId);

  useEffect(() => {
    if (customer?.email) {
      setTargetEmail(customer.email);
    }
  }, [customerId, customer]);

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

  function applyTemplate(key: keyof typeof templates) {
    const template = templates[key];
    setTitle(template.title);
    setMessage(template.message);
    setLink(template.link);
  }

  function chooseGame(id: string) {
    const game = games.find((item) => item.id === Number(id));
    if (!game) return;
    setTitle(`${game.title} is now available`);
    setMessage(`${game.title} has arrived at Rakexura. Check platforms, live pricing, trailers, and current offers.`);
    setLink(`/games/${game.id}`);
  }

  function notifyAll() {
    const data = new FormData();
    data.set("title", title);
    data.set("message", message);
    data.set("link", link);
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
      data.set("link", link);
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
    if (!targetEmail.trim()) return toast.error("Enter a target customer email address");
    setEmailPending(true);
    try {
      const data = new FormData();
      data.set("userId", customerId);
      data.set("email", targetEmail.trim());
      data.set("title", title);
      data.set("message", message);
      data.set("link", link);
      const result = await sendSingleEmailNotification(data);
      toast.success(`Email invoice/announcement successfully sent to ${result.recipient}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email notification");
    } finally {
      setEmailPending(false);
    }
  }

  async function sendComboToCustomer() {
    if (!customerId && !targetEmail) return toast.error("Select a customer or enter an email address");
    setComboPending(true);
    let emailStatus = false;
    let pushStatus = false;

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
      console.warn("Combo email dispatch failed:", e);
    }

    try {
      if (customerId) {
        const data = new FormData();
        data.set("userId", customerId);
        data.set("title", title);
        data.set("message", message);
        data.set("link", link);
        await sendSinglePushNotification(data);
        pushStatus = true;
      }
    } catch (e) {
      console.warn("Combo push dispatch failed:", e);
    }

    setComboPending(false);
    if (emailStatus || pushStatus) {
      toast.success(`Combined update sent! (Email: ${emailStatus ? '✓' : 'x'}, Push: ${pushStatus ? '✓' : 'x'})`);
    } else {
      toast.error("Failed to send multi-channel notification.");
    }
  }

  function openWhatsApp() {
    if (!customer?.whatsapp) return toast.error("This customer has no saved WhatsApp number");
    const phone = customer.whatsapp.replace(/\D/g, "");
    const normalized = phone.length === 10 ? `91${phone}` : phone;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(`${title}\n\n${message}\n\n${location.origin}${link}`)}`, "_blank", "noopener,noreferrer");
  }

  const gameOptions = [
    { value: "", label: "Custom announcement" },
    ...games.map((g) => ({ value: String(g.id), label: g.title })),
  ];

  const customerOptions = [
    { value: "", label: "Choose customer" },
    ...customers.map((c) => ({
      value: c.id,
      label: c.display_name || "Customer",
      sublabel: `${c.email ? `Email: ${c.email}` : "No email"} · ${c.whatsapp ? `WA: ${c.whatsapp}` : "No phone"}`,
    })),
  ];

  const giftGameOptions = [
    { value: "", label: "Choose game to gift" },
    ...games.map((g) => ({ value: String(g.id), label: g.title })),
  ];

  const platformOptions = [
    { value: "Steam", label: "Steam" },
    { value: "Epic", label: "Epic" },
    { value: "Offline", label: "Offline" },
    { value: "Xbox", label: "Xbox" },
    { value: "Nvidia GeForce", label: "Nvidia GeForce" },
  ];

  const [selectedGameId, setSelectedGameId] = useState("");

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="premium-panel rounded-lg p-5 md:p-7">
        <div className="flex items-center gap-3">
          <BellRing className="text-[#b9a4ff]" />
          <div>
            <h2 className="text-xl font-black">Create an update</h2>
            <p className="text-sm text-[#8991a6]">Send a safe in-app, push, or email notification to registered customers.</p>
          </div>
        </div>

        {/* Preset Templates Options */}
        <div className="mt-5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#8991a8]">
            ⚡ Select Notification Template
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(templates) as Array<keyof typeof templates>).map((key) => {
              const item = templates[key];
              const Icon = item.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className="btn btn-secondary text-xs font-bold transition hover:border-[#b9a4ff]/50 hover:bg-[#8b5cf6]/10 cursor-pointer"
                >
                  <Icon size={14} className="text-[#b9a4ff]" /> {item.label}
                </button>
              );
            })}
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
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            rows={5}
            className="mt-2 w-full rounded-md border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-white outline-none focus:border-[#8b5cf6]"
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

        <button onClick={notifyAll} disabled={pending} className="btn btn-primary mt-6 w-full cursor-pointer">
          <Send size={16} />{pending ? "Sending Broadcast..." : "Notify all customer accounts (In-App + Push + Email)"}
        </button>
      </section>

      <aside className="space-y-5">
        {/* Targeted Customer Communications panel */}
        <div className="premium-panel h-fit rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-[#20c763]" />
            <h2 className="text-lg font-black">Targeted Customer Messaging</h2>
          </div>
          <p className="text-xs leading-5 text-[#8991a6]">
            Select a customer to send a targeted lockscreen push, WhatsApp message, or direct email invoice/update.
          </p>

          <div>
            <label className="block text-xs font-bold text-[#8991a8] mb-1.5">Select Customer Profile</label>
            <CustomSelect
              options={customerOptions}
              value={customerId}
              onChange={(val) => setCustomerId(val)}
              placeholder="Choose customer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8991a8] mb-1.5">Customer Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="customer@gmail.com"
                className="h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 pl-9 text-xs text-white outline-none focus:border-[#8b5cf6]"
              />
              <Mail size={14} className="absolute left-3 top-3 text-[#8991a8]" />
            </div>
          </div>

          <div className="rounded-md border border-white/[.07] bg-black/20 p-3.5 text-xs leading-5 text-[#aab1c1]">
            <strong className="block text-white font-bold">{title}</strong>
            <span className="mt-1 block text-zinc-300">{message}</span>
            {targetEmail && <span className="mt-2 block text-[11px] text-[#b9a4ff] font-mono">Recipient: {targetEmail}</span>}
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={sendEmailToCustomer}
              disabled={emailPending}
              className="btn w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Mail size={15} /> {emailPending ? "Sending Email..." : "Send Direct Email"}
            </button>

            <button
              type="button"
              onClick={sendPushToCustomer}
              disabled={pushPending}
              className="btn w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Send size={15} /> {pushPending ? "Sending Push..." : "Send Device Push"}
            </button>

            <button
              type="button"
              onClick={sendComboToCustomer}
              disabled={comboPending}
              className="btn w-full bg-gradient-to-r from-[#8b5cf6] to-[#00d68f] hover:opacity-90 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={15} /> {comboPending ? "Sending..." : "Send Email + Device Push (Combo)"}
            </button>

            <button
              type="button"
              onClick={openWhatsApp}
              className="btn w-full bg-[#20c763] hover:bg-[#1bb057] text-black font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageCircle size={15} /> Open WhatsApp
            </button>
          </div>
        </div>

        {/* Giveaway / Gift Game Panel */}
        <div className="premium-panel h-fit rounded-lg p-5">
          <Gift className="text-[#facc15]" />
          <h2 className="mt-4 text-lg font-black">Giveaway / Gift Game</h2>
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

          <button onClick={sendGiftGame} disabled={giftPending} className="btn mt-5 w-full btn-primary bg-[#8b5cf6] hover:bg-[#7c3aed] text-white cursor-pointer">
            <Gift size={16} /> {giftPending ? "Gifting..." : "Gift Game"}
          </button>
        </div>
      </aside>
    </div>
  );
}
