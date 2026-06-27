"use client";

import { BellRing, Gamepad2, Gift, MessageCircle, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendStoreAnnouncement, sendSinglePushNotification, giftGameToCustomer } from "@/app/admin/actions";

type Customer = { id: string; display_name: string | null; whatsapp: string | null };
type GameOption = { id: number; title: string };
const templates = {
  game: { title: "New game added", message: "A new game just landed at Rakexura. View the latest price and available platforms now.", link: "/games" },
  offer: { title: "New Rakexura offer", message: "A fresh limited-time offer is live. Open Rakexura before the deal ends.", link: "/games" },
  giveaway: { title: "Rakexura giveaway", message: "A new Rakexura giveaway is open. Check the details and join before entries close.", link: "/" },
};

export function BroadcastComposer({ customers, games, prefill }: { customers: Customer[]; games: GameOption[]; prefill?: string }) {
  const [title, setTitle] = useState(prefill ? `${prefill} is now available` : templates.game.title);
  const [message, setMessage] = useState(prefill ? `${prefill} has arrived at Rakexura. Check platforms, live pricing, trailers, and current offers.` : templates.game.message);
  const [link, setLink] = useState(prefill ? `/games` : templates.game.link);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [giftGameId, setGiftGameId] = useState("");
  const [giftPlatform, setGiftPlatform] = useState("Steam");
  const [giftPending, setGiftPending] = useState(false);
  const [pending, startTransition] = useTransition();
  const customer = customers.find((item) => item.id === customerId);

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
    setTitle(template.title); setMessage(template.message); setLink(template.link);
  }
  function chooseGame(id: string) {
    const game = games.find((item) => item.id === Number(id));
    if (!game) return;
    setTitle(`${game.title} is now available`);
    setMessage(`${game.title} has arrived at Rakexura. Check platforms, live pricing, trailers, and current offers.`);
    setLink(`/games/${game.id}`);
  }
  function notifyAll() {
    const data = new FormData(); data.set("title", title); data.set("message", message); data.set("link", link);
    startTransition(async () => { try { const result = await sendStoreAnnouncement(data); toast.success(`Notification sent to ${result.count} customer accounts`); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not send announcement"); } });
  }
  const [pushPending, setPushPending] = useState(false);
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
        toast.success(`Push notification sent successfully to ${result.sentCount} device(s)!`);
      } else {
        toast.warning("Notification saved, but the customer has no active device subscriptions.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send push notification");
    } finally {
      setPushPending(false);
    }
  }
  function openWhatsApp() {
    if (!customer?.whatsapp) return toast.error("This customer has no saved WhatsApp number");
    const phone = customer.whatsapp.replace(/\D/g, "");
    const normalized = phone.length === 10 ? `91${phone}` : phone;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(`${title}\n\n${message}\n\n${location.origin}${link}`)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
    <section className="premium-panel rounded-lg p-5 md:p-7"><div className="flex items-center gap-3"><BellRing className="text-[#b9a4ff]" /><div><h2 className="text-xl font-black">Create an update</h2><p className="text-sm text-[#8991a6]">Send a safe in-app notification to every registered customer.</p></div></div><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => applyTemplate("game")} className="btn btn-secondary text-xs"><Gamepad2 size={15} /> New game</button><button onClick={() => applyTemplate("offer")} className="btn btn-secondary text-xs"><Gift size={15} /> Offer</button><button onClick={() => applyTemplate("giveaway")} className="btn btn-secondary text-xs"><Gift size={15} /> Giveaway</button></div><label className="mt-5 block text-sm font-bold">Choose a game <span className="font-normal text-[#8991a6]">(optional)</span><select onChange={(event) => chooseGame(event.target.value)} defaultValue="" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4"><option value="">Custom announcement</option>{games.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}</select></label><label className="mt-4 block text-sm font-bold">Title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4" /></label><label className="mt-4 block text-sm font-bold">Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={300} rows={5} className="mt-2 w-full rounded-md border border-white/10 bg-black/25 p-4" /></label><label className="mt-4 block text-sm font-bold">Rakexura link<input value={link} onChange={(event) => setLink(event.target.value)} className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4" /></label><button onClick={notifyAll} disabled={pending} className="btn btn-primary mt-5 w-full"><Send size={16} />{pending ? "Sending..." : "Notify all customer accounts"}</button></section>
    <aside className="space-y-5">
      <div className="premium-panel h-fit rounded-lg p-5">
        <MessageCircle className="text-[#20c763]" />
        <h2 className="mt-4 text-lg font-black">WhatsApp & Device Push</h2>
        <p className="mt-2 text-sm leading-6 text-[#8991a6]">Choose one customer to send a targeted lockscreen push or WhatsApp chat message.</p>
        <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-5 h-12 w-full rounded-md border border-white/10 bg-black/25 px-3"><option value="">Choose customer</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.display_name || "Customer"} {item.whatsapp ? `· ${item.whatsapp}` : "· no number"}</option>)}</select>
        <div className="mt-4 rounded-md border border-white/[.07] bg-black/20 p-4 text-xs leading-5 text-[#aab1c1]"><strong className="block text-white">{title}</strong><span className="mt-2 block">{message}</span></div>
        <button onClick={openWhatsApp} className="btn mt-4 w-full bg-[#20c763] text-black"><MessageCircle size={16} /> Open WhatsApp</button>
        <button onClick={sendPushToCustomer} disabled={pushPending} className="btn mt-2 w-full btn-primary bg-white text-black"><Send size={16} /> {pushPending ? "Sending Push..." : "Send Device Push"}</button>
      </div>

      <div className="premium-panel h-fit rounded-lg p-5">
        <Gift className="text-[#facc15]" />
        <h2 className="mt-4 text-lg font-black">Giveaway / Gift Game</h2>
        <p className="mt-2 text-sm leading-6 text-[#8991a6]">Send a game directly to this customer's library and orders page at Rs. 0 as a giveaway.</p>
        
        <label className="mt-4 block text-xs font-bold text-[#8991a8]">Select Game</label>
        <select value={giftGameId} onChange={(e) => setGiftGameId(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-3">
          <option value="">Choose game to gift</option>
          {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>

        <label className="mt-4 block text-xs font-bold text-[#8991a8]">Select Platform</label>
        <select value={giftPlatform} onChange={(e) => setGiftPlatform(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-3">
          <option value="Steam">Steam</option>
          <option value="Epic">Epic</option>
          <option value="Offline">Offline</option>
        </select>

        <button onClick={sendGiftGame} disabled={giftPending} className="btn mt-5 w-full btn-primary bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">
          <Gift size={16} /> {giftPending ? "Gifting..." : "Gift Game"}
        </button>
      </div>
    </aside>
  </div>;
}
