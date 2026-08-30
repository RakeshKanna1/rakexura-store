"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Search, ExternalLink, ChevronLeft, ChevronRight, Copy, Check, Gamepad2, Zap, MessageCircle, Trash2, Clock, Sparkles, CheckSquare, Square } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { assetUrl, matchesSearchQuery } from "@/lib/utils";
import { OrderActions } from "@/components/admin/order-actions";
import { DeleteCustomerButton } from "@/components/admin/delete-customer-button";
import { ResellerCustomerButton } from "@/components/admin/reseller-customer-button";
import { ResellerBadge } from "@/components/ui/reseller-badge";
import { archiveGame, moderateProof, moderateReview, toggleCoupon, deleteCoupon, updateRequestStatus, toggleFlashSale, deleteFlashSale, toggleCampaign, deleteCampaign, deleteCampaignGame, bulkDeleteFlashSales, bulkUpdateFlashSalesSchedule, cleanupDuplicateFlashSales } from "@/app/admin/actions";

type AdminRow = Record<string, unknown> & { id?: number | string; screenshot_url?: string; proof_url?: string; media_urls?: string[]; media_links?: string[] };

function SubmitButton({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "positive" | "danger" }) {
  const { pending } = useFormStatus();
  const color = tone === "positive" ? "border-[#00d68f]/30 text-[#70efbb] hover:bg-[#00d68f]/10" : tone === "danger" ? "border-red-400/30 text-red-300 hover:bg-red-500/10" : "border-white/10 text-[#c8cedc] hover:bg-white/[.06]";
  return (
    <button
      type="submit"
      suppressHydrationWarning
      disabled={pending}
      className={`rounded border bg-black/20 px-3 py-2 text-xs font-bold transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5 ${color}`}
    >
      {pending ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function CopyCouponBadge({ code, discountType, discountValue, minimumOrder }: { code: string; discountType: string; discountValue: number; minimumOrder?: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const offerText = discountType === "percentage" ? `${discountValue}% OFF` : `Rs. ${discountValue} OFF`;
    const minOrderText = minimumOrder && minimumOrder > 0 ? ` (Min order: Rs. ${minimumOrder})` : "";
    const promoMessage = `Use coupon code "${code}" to get ${offerText}${minOrderText} on Rakexura Store! 🎁🎮\nShop now: https://rakexura-store.vercel.app/games`;

    navigator.clipboard.writeText(promoMessage);
    setCopied(true);
    toast.success(`Copied promo message for ${code}!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={handleCopy}
      title="Click to copy promo offer message for WhatsApp/Telegram"
      className="inline-flex items-center gap-1 rounded border border-[#8b5cf6]/40 bg-[#8b5cf6]/20 px-2 py-1 text-[11px] font-bold text-[#c4b5fd] transition hover:bg-[#8b5cf6]/40 hover:text-white cursor-pointer shrink-0"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      <span>{copied ? "Copied!" : "Copy Offer"}</span>
    </button>
  );
}

function CopyIdBadge({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success("User ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shortId = id.length > 14 ? `${id.slice(0, 8)}...` : id;

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={handleCopy}
      title={`Click to copy full ID: ${id}`}
      className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs font-mono font-bold text-[#a3aed0] hover:text-white hover:border-[#8b5cf6]/50 transition cursor-pointer shrink-0"
    >
      <span>{shortId}</span>
      {copied ? <Check size={12} className="text-green-400 shrink-0" /> : <Copy size={12} className="text-[#767e90] shrink-0" />}
    </button>
  );
}

function RowActions({ section, row }: { section: string; row: AdminRow }) {
  const id = Number(row.id);
  if (section === "customers") {
    const customerId = String(row.id || "");
    const customerName = String(row.display_name || "");
    const isAdmin = row.role === "admin";
    if (isAdmin) return <span className="text-[11px] font-bold text-[#b9a4ff]">Admin Profile</span>;
    return (
      <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
        <ResellerCustomerButton
          userId={customerId}
          customerName={customerName}
          isReseller={Boolean(row.is_reseller)}
          currentDiscount={Number(row.reseller_discount || 25)}
          currentDiscountType={String(row.reseller_discount_type || "percentage")}
        />
        <DeleteCustomerButton userId={customerId} customerName={customerName} />
      </div>
    );
  }
  if (section === "orders") {
    const items = Array.isArray(row.cart_items) ? row.cart_items as Array<Record<string, unknown>> : [];
    const gameName = items.length ? items.map((item) => String(item.title || "Game")).join(", ") : "Order items";
    return (
      <OrderActions
        id={id}
        currentStatus={String(row.order_status ?? "Pending")}
        customerPhone={String(row.customer_whatsapp || "")}
        gameName={gameName}
        orderReference={String(row.order_reference || `#${row.id}`)}
        initialAccountAccess={String(row.account_access || "")}
        totalPrice={Number(row.total_price || 0)}
      />
    );
  }
  if (section === "reviews") {
    const isApproved = row.approved === true || String(row.approved) === "true";
    return (
      <div className="flex flex-wrap gap-2">
        {row.media_links?.map((url, index) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded border border-white/10 px-3 py-2 text-xs font-bold text-[#f8e38a]"
          >
            <ExternalLink size={13} /> Media {index + 1}
          </a>
        ))}
        {isApproved ? (
          <span className="bg-green-500/10 text-green-400 border border-green-500/30 font-medium px-3 py-1.5 rounded-lg text-xs">
            Approved ✓
          </span>
        ) : (
          <form action={moderateReview}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value="approve" />
            <SubmitButton tone="positive">Approve</SubmitButton>
          </form>
        )}
        <form action={moderateReview}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="delete" />
          <SubmitButton tone="danger">Delete</SubmitButton>
        </form>
      </div>
    );
  }
  if (section === "requests") return <div className="flex min-w-60 flex-wrap gap-2">{["Reviewing", "Planned", "Added", "Declined"].map((status) => <form action={updateRequestStatus} key={status}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} /><SubmitButton tone={status === "Declined" ? "danger" : status === "Added" ? "positive" : "neutral"}>{status}</SubmitButton></form>)}</div>;
  if (section === "coupons") return (
    <div className="flex gap-2 items-center">
      <Link href={`/admin/coupons?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc]">
        Edit
      </Link>
      <form action={toggleCoupon}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="active" value={String(!row.active)} />
        <SubmitButton tone={row.active ? "neutral" : "positive"}>{row.active ? "Disable" : "Enable"}</SubmitButton>
      </form>
      <form action={deleteCoupon}>
        <input type="hidden" name="id" value={id} />
        <SubmitButton tone="danger">Delete</SubmitButton>
      </form>
    </div>
  );
  if (section === "support") return <Link href={`/dashboard/support/${id}`} className="inline-flex min-h-9 items-center gap-2 rounded border border-white/10 bg-black/20 px-3 text-xs font-bold text-[#f8e38a]"><ExternalLink size={13} /> Open conversation</Link>;
  if (section === "games") return (
    <div className="flex items-center gap-2">
      <Link href={`/admin/games?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc] hover:text-white transition">
        Edit
      </Link>
      <form action={archiveGame}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="archived" value={String(!row.archived)} />
        <SubmitButton tone={row.archived ? "positive" : "danger"}>
          {row.archived ? "Restore" : "Archive"}
        </SubmitButton>
      </form>
      <Link href={`/games/${id}`} target="_blank" className="rounded border border-white/10 bg-black/20 p-2 text-xs font-bold text-[#8991a6] hover:text-white hover:border-white/30 transition" title="View live game on store">
        <ExternalLink size={13} />
      </Link>
    </div>
  );
  if (section === "media") return <div className="flex gap-2">{!row.approved && <form action={moderateProof}><input type="hidden" name="id" value={id} /><input type="hidden" name="decision" value="approve" /><SubmitButton tone="positive">Approve</SubmitButton></form>}<form action={moderateProof}><input type="hidden" name="id" value={id} /><input type="hidden" name="decision" value="delete" /><SubmitButton tone="danger">Delete</SubmitButton></form></div>;
  if (section === "flash-sales") return <div className="flex gap-2"><Link href={`/admin/flash-sales?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc]">Edit</Link><form action={toggleFlashSale}><input type="hidden" name="id" value={id} /><input type="hidden" name="active" value={String(!row.active)} /><SubmitButton tone={row.active ? "danger" : "positive"}>{row.active ? "Disable" : "Enable"}</SubmitButton></form><form action={deleteFlashSale}><input type="hidden" name="id" value={id} /><SubmitButton tone="danger">Delete</SubmitButton></form></div>;
  if (section === "campaigns") return <div className="flex gap-2"><Link href={`/admin/campaigns?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc]">Edit</Link><form action={toggleCampaign}><input type="hidden" name="id" value={id} /><input type="hidden" name="active" value={String(!row.active)} /><SubmitButton tone={row.active ? "danger" : "positive"}>{row.active ? "Disable" : "Enable"}</SubmitButton></form><form action={deleteCampaign}><input type="hidden" name="id" value={id} /><SubmitButton tone="danger">Delete</SubmitButton></form></div>;
  if (section === "campaign-games") return <div className="flex gap-2"><Link href={`/admin/campaign-games?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc]">Edit</Link><form action={deleteCampaignGame}><input type="hidden" name="id" value={id} /><SubmitButton tone="danger">Delete</SubmitButton></form></div>;
  return null;
}

function formatDate12h(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return (
      date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " at " +
      date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    );
  } catch {
    return isoString;
  }
}

function formatWhatsApp(val: unknown): { display: string; linkUrl: string } | null {
  if (!val) return null;
  const digits = String(val).replace(/\D/g, "");
  if (!digits || digits.length < 7) return null;

  let coreNumber = digits;
  if (digits.length === 12 && digits.startsWith("91")) {
    coreNumber = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    coreNumber = digits.slice(1);
  }

  let displayText = `+${digits}`;
  if (coreNumber.length === 10) {
    displayText = `+91 ${coreNumber.slice(0, 5)} ${coreNumber.slice(5)}`;
  }

  const linkDigits = coreNumber.length === 10 ? `91${coreNumber}` : digits;
  return { display: displayText, linkUrl: `https://wa.me/${linkDigits}` };
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  const str = String(value);
  if (str.length >= 19 && (str.includes("T") || (str.includes("-") && str.includes(":"))) && !isNaN(Date.parse(str))) {
    return formatDate12h(str);
  }
  return str;
}

export function SearchableTable({ rows, headers, section, hasActions }: { rows: AdminRow[]; headers: string[]; section: string; hasActions: boolean }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkEndTime, setBulkEndTime] = useState("");
  const pageSize = 15;

  const filtered = rows.filter((row) => {
    if (!query.trim()) return true;
    return headers.some((header) => {
      const val = row[header];
      if (val === null || val === undefined) return false;
      return matchesSearchQuery(String(val), query);
    });
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSelectId = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const allPageIds = paginated.map((r) => Number(r.id)).filter((id) => !isNaN(id) && id > 0);
  const isAllPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allPageIds])));
    }
  };

  const setPresetHours = (hours: number) => {
    const now = new Date();
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const localStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
    setBulkEndTime(localStr);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 max-w-md items-center gap-3 rounded-md border border-white/10 bg-black/25 px-4 py-1 text-sm outline-none focus-within:border-white/30">
          <Search size={16} className="text-[#8991a6] shrink-0" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={`Search ${section}...`}
            suppressHydrationWarning={true}
            className="h-10 w-full bg-transparent outline-none placeholder:text-[#767e90] text-white"
          />
        </div>

        {section === "flash-sales" && (
          <div className="flex items-center gap-2">
            <form action={cleanupDuplicateFlashSales}>
              <SubmitButton tone="neutral">
                <Sparkles size={13} className="text-[#facc15]" />
                <span>Clean Duplicates</span>
              </SubmitButton>
            </form>
          </div>
        )}
      </div>

      {section === "flash-sales" && selectedIds.length > 0 && (
        <div className="rounded-lg border border-[#facc15]/30 bg-[#facc15]/10 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-[#facc15] px-2.5 py-1 text-xs font-black text-black">
                <CheckSquare size={13} /> {selectedIds.length} Selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-semibold text-[#8991a6] hover:text-white"
              >
                Deselect All
              </button>
            </div>

            <form action={bulkDeleteFlashSales}>
              {selectedIds.map((id) => (
                <input key={id} type="hidden" name="ids" value={id} />
              ))}
              <SubmitButton tone="danger">
                <Trash2 size={13} /> Delete {selectedIds.length} Selected
              </SubmitButton>
            </form>
          </div>

          <form action={bulkUpdateFlashSalesSchedule} className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <input type="hidden" name="tz_offset" value={new Date().getTimezoneOffset()} />
            
            <span className="text-xs text-[#8991a6] font-semibold flex items-center gap-1">
              <Clock size={12} /> Set New End Date:
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPresetHours(24)}
                className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-bold text-white hover:border-[#facc15] hover:text-[#facc15]"
              >
                24h
              </button>
              <button
                type="button"
                onClick={() => setPresetHours(48)}
                className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-bold text-white hover:border-[#facc15] hover:text-[#facc15]"
              >
                48h
              </button>
              <button
                type="button"
                onClick={() => setPresetHours(72)}
                className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-bold text-white hover:border-[#facc15] hover:text-[#facc15]"
              >
                3 Days
              </button>
              <button
                type="button"
                onClick={() => setPresetHours(168)}
                className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-bold text-white hover:border-[#facc15] hover:text-[#facc15]"
              >
                7 Days
              </button>
            </div>

            <input
              type="datetime-local"
              name="ends_at"
              required
              value={bulkEndTime}
              onChange={(e) => setBulkEndTime(e.target.value)}
              className="h-8 rounded border border-white/10 bg-black/40 px-2.5 text-xs text-white outline-none focus:border-[#facc15]"
            />

            <SubmitButton tone="positive">
              <Clock size={13} /> Apply Schedule to ({selectedIds.length})
            </SubmitButton>
          </form>
        </div>
      )}

      {section === "games" ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-md border border-white/10">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-white/[.04] text-[#8991a6]">
                <tr>
                  <th className="p-4 w-16">ID</th>
                  <th className="p-4">Game</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Pricing & Plans</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, index) => {
                  const isSub = Boolean(row.is_subscription);
                  const isArchived = Boolean(row.archived);

                  return (
                    <tr key={String(row.id ?? index)} className="border-t border-white/[.07] hover:bg-white/[.025]">
                      <td className="p-4 font-mono font-bold text-[#8991a6]">
                        #{String(row.id)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {row.cover_image ? (
                            <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-black/40 border border-white/10">
                              <Image
                                src={assetUrl(String(row.cover_image))}
                                alt=""
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0">
                            <strong className="block text-sm font-bold text-white leading-tight">
                              {String(row.title || "Untitled")}
                            </strong>
                            {row.duration ? (
                              <span className="text-[11px] text-[#8991a6] block mt-0.5">
                                {String(row.duration)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {isSub ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/10 text-white border border-white/20">
                            <Zap size={12} className="text-[#facc15]" />
                            Subscription
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-black/40 text-[#8991a6] border border-white/10">
                            <Gamepad2 size={12} />
                            PC Game
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isSub ? (
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {row.price_1m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">1M: ₹{String(row.price_1m)}</span> : null}
                            {row.price_2m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">2M: ₹{String(row.price_2m)}</span> : null}
                            {row.price_3m ? <span className="rounded bg-[#facc15]/10 border border-[#facc15]/30 px-2 py-0.5 font-bold text-[#facc15]">3M: ₹{String(row.price_3m)}</span> : null}
                            {row.price_6m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">6M: ₹{String(row.price_6m)}</span> : null}
                            {row.price_12m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">12M: ₹{String(row.price_12m)}</span> : null}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {row.steam_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Steam: <b className="text-white">₹{String(row.steam_price)}</b></span> : null}
                            {row.epic_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Epic: <b className="text-white">₹{String(row.epic_price)}</b></span> : null}
                            {row.offline_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Offline: <b className="text-white">₹{String(row.offline_price)}</b></span> : null}
                            {row.online_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Online: <b className="text-white">₹{String(row.online_price)}</b></span> : null}
                            {row.xbox_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Xbox: <b className="text-white">₹{String(row.xbox_price)}</b></span> : null}
                            {row.geforce_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">GFN: <b className="text-white">₹{String(row.geforce_price)}</b></span> : null}
                            {!row.steam_price && !row.epic_price && !row.offline_price && !row.online_price && !row.xbox_price && !row.geforce_price && row.sale_price ? (
                              <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">Sale: ₹{String(row.sale_price)}</span>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {isArchived ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            Archived
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <RowActions section={section} row={row} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {paginated.map((row, index) => {
              const isSub = Boolean(row.is_subscription);
              const isArchived = Boolean(row.archived);

              return (
                <article
                  key={String(row.id ?? index)}
                  className="rounded-xl border border-white/10 bg-[#0d0b1a]/90 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex gap-3">
                    {row.cover_image ? (
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-black/40 border border-white/10">
                        <Image src={assetUrl(String(row.cover_image))} alt="" fill sizes="48px" className="object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white text-sm leading-snug">{String(row.title || "Untitled")}</h3>
                        {isArchived ? (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Archived</span>
                        ) : (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#8991a6]">
                        <span className="font-mono font-bold text-white/80">#{String(row.id)}</span>
                        {row.duration ? <span>· {String(row.duration)}</span> : null}
                        {isSub ? (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#facc15]"><Zap size={11} /> Sub</span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-[#a0a8c0]"><Gamepad2 size={11} /> PC Game</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-black/30 p-2.5 text-xs">
                    {isSub ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.price_1m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-white font-bold">1M: ₹{String(row.price_1m)}</span> : null}
                        {row.price_2m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-white font-bold">2M: ₹{String(row.price_2m)}</span> : null}
                        {row.price_3m ? <span className="rounded bg-[#facc15]/10 border border-[#facc15]/30 px-2 py-0.5 text-[#facc15] font-bold">3M: ₹{String(row.price_3m)}</span> : null}
                        {row.price_6m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-white font-bold">6M: ₹{String(row.price_6m)}</span> : null}
                        {row.price_12m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-white font-bold">12M: ₹{String(row.price_12m)}</span> : null}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {row.steam_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Steam: <b className="text-white">₹{String(row.steam_price)}</b></span> : null}
                        {row.epic_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Epic: <b className="text-white">₹{String(row.epic_price)}</b></span> : null}
                        {row.offline_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Offline: <b className="text-white">₹{String(row.offline_price)}</b></span> : null}
                        {row.online_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Online: <b className="text-white">₹{String(row.online_price)}</b></span> : null}
                        {row.xbox_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">Xbox: <b className="text-white">₹{String(row.xbox_price)}</b></span> : null}
                        {row.geforce_price ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 text-[#8991a6]">GFN: <b className="text-white">₹{String(row.geforce_price)}</b></span> : null}
                        {!row.steam_price && !row.epic_price && !row.offline_price && !row.online_price && !row.xbox_price && !row.geforce_price && row.sale_price ? (
                          <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">Sale: ₹{String(row.sale_price)}</span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end">
                    <RowActions section={section} row={row} />
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : section === "flash-sales" ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-md border border-white/10">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead className="bg-white/[.04] text-[#8991a6]">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAllPage}
                      className="h-4 w-4 rounded border-white/20 bg-black text-[#facc15] cursor-pointer"
                    />
                  </th>
                  <th className="p-4 w-16">ID</th>
                  <th className="p-4">Game / Product</th>
                  <th className="p-4">Flash Pricing</th>
                  <th className="p-4">Starts At</th>
                  <th className="p-4">Ends At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, index) => {
                  const idNum = Number(row.id);
                  const isSelected = selectedIds.includes(idNum);
                  const isSub = Boolean(row.is_subscription);
                  const isActive = Boolean(row.active);
                  const startsDate = row.starts_at ? new Date(String(row.starts_at)) : null;
                  const endsDate = row.ends_at ? new Date(String(row.ends_at)) : null;
                  const now = Date.now();
                  const isLive = isActive && startsDate && endsDate && startsDate.getTime() <= now && endsDate.getTime() > now;
                  const isUpcoming = isActive && startsDate && startsDate.getTime() > now;
                  const isExpired = endsDate && endsDate.getTime() <= now;

                  return (
                    <tr
                      key={String(row.id ?? index)}
                      className={`border-t border-white/[.07] transition-colors ${
                        isSelected ? "bg-[#facc15]/[0.08]" : "hover:bg-white/[.025]"
                      }`}
                    >
                      <td className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectId(idNum)}
                          className="h-4 w-4 rounded border-white/20 bg-black text-[#facc15] cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-mono font-bold text-[#8991a6]">
                        #{String(row.id)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {row.cover_image ? (
                            <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-black/40 border border-white/10">
                              <Image
                                src={assetUrl(String(row.cover_image))}
                                alt=""
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0">
                            <strong className="block text-sm font-bold text-white leading-tight">
                              {String(row.game_title || `Game #${row.game_id}`)}
                            </strong>
                            {isSub ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#facc15] font-semibold mt-0.5">
                                <Zap size={11} /> Subscription Pass
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#8991a6] block mt-0.5">
                                Game ID: #{String(row.game_id)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {isSub ? (
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {row.sale_price ? <span className="rounded bg-[#facc15]/10 border border-[#facc15]/30 px-2 py-0.5 font-bold text-[#facc15]">1M: ₹{String(row.sale_price)}</span> : null}
                            {row.price_2m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">2M: ₹{String(row.price_2m)}</span> : null}
                            {row.price_3m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">3M: ₹{String(row.price_3m)}</span> : null}
                            {row.price_6m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">6M: ₹{String(row.price_6m)}</span> : null}
                            {row.price_12m ? <span className="rounded bg-black/40 border border-white/10 px-2 py-0.5 font-bold text-white">12M: ₹{String(row.price_12m)}</span> : null}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-[#facc15]/10 border border-[#facc15]/30 px-2.5 py-1 text-xs font-black text-[#facc15]">
                            ₹{String(row.sale_price)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-[#c8cedc] font-medium whitespace-nowrap">
                        {row.starts_at ? formatDate12h(String(row.starts_at)) : "-"}
                      </td>
                      <td className="p-4 text-xs text-[#c8cedc] font-medium whitespace-nowrap">
                        {row.ends_at ? formatDate12h(String(row.ends_at)) : "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {!isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-white/5 text-[#8991a6] border border-white/10">
                            Disabled
                          </span>
                        ) : isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Now
                          </span>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Scheduled
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <RowActions section={section} row={row} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {paginated.map((row, index) => {
              const idNum = Number(row.id);
              const isSelected = selectedIds.includes(idNum);
              const isSub = Boolean(row.is_subscription);
              const isActive = Boolean(row.active);
              const startsDate = row.starts_at ? new Date(String(row.starts_at)) : null;
              const endsDate = row.ends_at ? new Date(String(row.ends_at)) : null;
              const now = Date.now();
              const isLive = isActive && startsDate && endsDate && startsDate.getTime() <= now && endsDate.getTime() > now;
              const isUpcoming = isActive && startsDate && startsDate.getTime() > now;

              return (
                <article
                  key={String(row.id ?? index)}
                  className={`rounded-xl border p-4 space-y-3 shadow-sm transition-colors ${
                    isSelected ? "border-[#facc15]/50 bg-[#facc15]/[0.08]" : "border-white/10 bg-[#0d0b1a]/90"
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectId(idNum)}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-black text-[#facc15] cursor-pointer shrink-0"
                    />
                    {row.cover_image ? (
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-black/40 border border-white/10">
                        <Image src={assetUrl(String(row.cover_image))} alt="" fill sizes="48px" className="object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white text-sm leading-snug">{String(row.game_title || `Game #${row.game_id}`)}</h3>
                        {!isActive ? (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-white/5 text-[#8991a6] border border-white/10">Disabled</span>
                        ) : isLive ? (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                          </span>
                        ) : isUpcoming ? (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Scheduled</span>
                        ) : (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Expired</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#8991a6]">
                        <span className="font-mono font-bold text-white/80">#{String(row.id)}</span>
                        {isSub ? (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#facc15]"><Zap size={11} /> Sub</span>
                        ) : (
                          <span className="rounded bg-[#facc15]/10 border border-[#facc15]/30 px-2 py-0.5 text-[11px] font-black text-[#facc15]">
                            ₹{String(row.sale_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/30 p-2.5 rounded-lg text-[#8991a6]">
                    <div>
                      <span className="block text-[#646b7b]">Starts:</span>
                      <span className="font-medium text-[#c8cedc]">{row.starts_at ? formatDate12h(String(row.starts_at)) : "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[#646b7b]">Ends:</span>
                      <span className="font-medium text-[#c8cedc]">{row.ends_at ? formatDate12h(String(row.ends_at)) : "-"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end">
                    <RowActions section={section} row={row} />
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-md border border-[#8b5cf6]/20">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead className="bg-white/[.04] text-[#8991a6]">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-3.5 py-3 capitalize text-xs font-bold whitespace-nowrap">
                      {header === "whatsapp"
                        ? "WhatsApp"
                        : header === "is_reseller"
                        ? "Partner Status"
                        : header === "usage_limit"
                        ? "Global Limit"
                        : header === "per_user_limit"
                        ? "Limit Per User"
                        : header === "used_count"
                        ? "Times Used"
                        : header === "created_at"
                        ? "Joined Date"
                        : header === "applicable_to"
                        ? "Scope / Target"
                        : header.replaceAll("_", " ")}
                    </th>
                  ))}
                  {hasActions && <th className="px-3.5 py-3 text-xs font-bold whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, index) => (
                  <tr key={String(row.id ?? index)} className="border-t border-white/[.07] hover:bg-white/[.025]">
                    {headers.map((header) => {
                      const isCodeColumn = section === "coupons" && header === "code";
                      const isApplicableToColumn = section === "coupons" && header === "applicable_to";
                      const isRoleColumn = section === "customers" && header === "role";
                      const isWhatsappColumn = header === "whatsapp" || header === "customer_whatsapp";
                      const isImageColumn = header === "image_url" || header === "screenshot_url" || header === "proof_url" || (header === "cover_image" && section !== "games");
                      const isProofTypeColumn = header === "proof_type";
                      const isApprovedColumn = header === "approved";
                      const isResellerColumn = header === "is_reseller";
                      const isDiscountColumn = header === "reseller_discount";
                      const val = row[header];
                      const lowerHeader = header.toLowerCase();
                      const isIdColumn = (lowerHeader === "id" || lowerHeader.endsWith("_id") || lowerHeader === "visitor_id") && typeof val === "string" && val.length > 10;

                      return (
                        <td key={header} className="max-w-72 truncate px-3.5 py-3">
                          {isCodeColumn ? (
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-bold text-white bg-black/40 px-2 py-1 rounded border border-white/10">
                                {String(row[header])}
                              </code>
                              <CopyCouponBadge
                                code={String(row.code || "")}
                                discountType={String(row.discount_type || "percentage")}
                                discountValue={Number(row.discount_value || 0)}
                                minimumOrder={Number(row.minimum_order || 0)}
                              />
                            </div>
                          ) : isApplicableToColumn ? (
                            val === "subscription" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                Subscriptions Only
                              </span>
                            ) : val === "normal" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                Normal Games Only
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                All Items (Both)
                              </span>
                            )
                          ) : isWhatsappColumn ? (
                            (() => {
                              const parsed = formatWhatsApp(val);
                              if (!parsed) return <span className="text-xs text-[#646b7b]">-</span>;
                              return (
                                <a
                                  href={parsed.linkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Click to chat with ${parsed.display} on WhatsApp`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#20c763]/10 text-[#20c763] border border-[#20c763]/25 hover:bg-[#20c763]/20 hover:border-[#20c763]/50 transition cursor-pointer whitespace-nowrap"
                                >
                                  <MessageCircle size={13} className="shrink-0" />
                                  <span>{parsed.display}</span>
                                </a>
                              );
                            })()
                          ) : isRoleColumn ? (
                            val === "admin" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#8b5cf6]/15 text-[#b9a4ff] border border-[#8b5cf6]/30">
                                Admin
                              </span>
                            ) : (row.is_reseller || (row.reseller_discount && Number(row.reseller_discount) > 0)) ? (
                              <ResellerBadge size="sm" discount={row.reseller_discount as number} discountType={row.reseller_discount_type as string} />
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/5 text-[#8991a6] border border-white/10">
                                Customer
                              </span>
                            )
                          ) : isResellerColumn ? (
                            val ? (
                              <ResellerBadge size="sm" discount={row.reseller_discount as number} discountType={row.reseller_discount_type as string} isAdmin={true} />
                            ) : (
                              <span className="text-xs text-[#646b7b]">Standard</span>
                            )
                          ) : isDiscountColumn ? (
                            val && Number(val) > 0 ? (
                              <span className="font-mono font-bold text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/30 px-2 py-0.5 rounded text-xs">
                                {row.reseller_discount_type === "flat"
                                  ? `-₹${val}`
                                  : row.reseller_discount_type === "markup_flat"
                                  ? `+₹${val}`
                                  : row.reseller_discount_type === "markup_percentage"
                                  ? `+${val}%`
                                  : `-${val}%`}
                              </span>
                            ) : (
                              "-"
                            )
                          ) : isImageColumn && typeof val === "string" && val ? (
                            <a href={val} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2.5">
                              <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded border border-white/10 bg-black/40 group-hover:border-white/40 transition">
                                <Image src={assetUrl(val)} alt="" fill sizes="56px" className="object-cover" />
                              </div>
                              <span className="text-xs text-[#8991a6] group-hover:text-white inline-flex items-center gap-1 font-medium transition">
                                View <ExternalLink size={11} />
                              </span>
                            </a>
                          ) : isProofTypeColumn && typeof val === "string" && val ? (
                            val === "whatsapp" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#20c763]/10 text-[#20c763] border border-[#20c763]/25">
                                <MessageCircle size={11} /> WhatsApp
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 capitalize">
                                {val}
                              </span>
                            )
                          ) : isApprovedColumn ? (
                            val === true || val === "true" || val === "Yes" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                Pending
                              </span>
                            )
                          ) : isIdColumn ? (
                            <CopyIdBadge id={String(val)} />
                          ) : (
                            display(val)
                          )}
                        </td>
                      );
                    })}
                    {hasActions && (
                      <td className="px-3.5 py-3">
                        <RowActions section={section} row={row} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {paginated.map((row, index) => {
              if (section === "customers") {
                const customerId = String(row.id || "");
                const customerName = String(row.display_name || "Gamer");
                const email = String(row.email || "");
                const role = String(row.role || "customer");
                const isAdmin = role === "admin";
                const isReseller = Boolean(row.is_reseller);
                const discount = Number(row.reseller_discount || 0);
                const discountType = String(row.reseller_discount_type || "percentage");

                return (
                  <article
                    key={customerId || index}
                    className="rounded-xl border border-[#8b5cf6]/20 bg-[#0d0b1a]/90 p-4 space-y-3 shadow-sm"
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/35 text-xs font-black text-[#c4b5fd]">
                          {customerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-sm truncate leading-tight">
                            {customerName}
                          </h3>
                          <p className="text-xs text-[#8991a6] truncate mt-0.5">
                            {email || "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isAdmin ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#8b5cf6]/20 text-[#b9a4ff] border border-[#8b5cf6]/40">
                            Admin
                          </span>
                        ) : isReseller || discount > 0 ? (
                          <ResellerBadge size="sm" discount={discount} discountType={discountType} />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-[#8991a6] border border-white/10">
                            Customer
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details Rows */}
                    <div className="grid grid-cols-1 gap-2 pt-1 border-t border-white/[0.06] text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#8991a6]">User ID:</span>
                        <CopyIdBadge id={customerId} />
                      </div>

                      {row.whatsapp ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#8991a6]">WhatsApp:</span>
                          {(() => {
                            const parsed = formatWhatsApp(row.whatsapp);
                            if (!parsed) return <span className="text-[#646b7b]">-</span>;
                            return (
                              <a
                                href={parsed.linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#20c763]/10 text-[#20c763] border border-[#20c763]/25 hover:bg-[#20c763]/20"
                              >
                                <MessageCircle size={13} className="shrink-0" />
                                <span>{parsed.display}</span>
                              </a>
                            );
                          })()}
                        </div>
                      ) : null}

                      {row.created_at ? (
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#767e90]">
                          <span>Joined:</span>
                          <span>{formatDate12h(String(row.created_at))}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    {hasActions && (
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end">
                        <RowActions section={section} row={row} />
                      </div>
                    )}
                  </article>
                );
              }

              // Generic Mobile Card for all other sections
              return (
                <article
                  key={String(row.id ?? index)}
                  className="rounded-xl border border-white/10 bg-[#0d0b1a]/90 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {section === "coupons" && row.code ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="font-mono font-bold text-white bg-black/50 px-2.5 py-1 rounded border border-white/15 text-sm">
                            {String(row.code)}
                          </code>
                          <CopyCouponBadge
                            code={String(row.code || "")}
                            discountType={String(row.discount_type || "percentage")}
                            discountValue={Number(row.discount_value || 0)}
                            minimumOrder={Number(row.minimum_order || 0)}
                          />
                        </div>
                      ) : row.customer_name ? (
                        <div>
                          <h3 className="font-bold text-white text-sm">{String(row.customer_name)}</h3>
                          {row.rating ? <div className="flex items-center gap-0.5 text-[#facc15] text-xs mt-0.5">{"★".repeat(Number(row.rating))}</div> : null}
                        </div>
                      ) : row.game_name ? (
                        <h3 className="font-bold text-white text-sm">{String(row.game_name)}</h3>
                      ) : row.name ? (
                        <h3 className="font-bold text-white text-sm">{String(row.name)}</h3>
                      ) : row.subject ? (
                        <h3 className="font-bold text-white text-sm">{String(row.subject)}</h3>
                      ) : (
                        <span className="font-mono font-bold text-white text-sm">#{String(row.id ?? index)}</span>
                      )}
                    </div>

                    {row.status ? (
                      <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold bg-white/10 text-white border border-white/15">
                        {String(row.status)}
                      </span>
                    ) : row.active !== undefined ? (
                      <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${row.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-[#8991a6] border border-white/10"}`}>
                        {row.active ? "Active" : "Disabled"}
                      </span>
                    ) : null}
                  </div>

                  {/* Section specific / Generic key-values */}
                  <div className="space-y-1.5 pt-1 border-t border-white/[0.06] text-xs">
                    {headers.map((header) => {
                      if (header === "code" && section === "coupons") return null;
                      if (header === "customer_name" && section === "reviews") return null;
                      if (header === "game_name" && section === "requests") return null;
                      if (header === "subject" && section === "support") return null;
                      const val = row[header];
                      if (val === undefined || val === null || val === "") return null;
                      const lowerHeader = header.toLowerCase();
                      const isIdColumn = (lowerHeader === "id" || lowerHeader.endsWith("_id") || lowerHeader === "visitor_id") && typeof val === "string" && val.length > 10;
                      const isWhatsapp = header === "whatsapp" || header === "customer_whatsapp";
                      const isApplicableTo = section === "coupons" && header === "applicable_to";

                      return (
                        <div key={header} className="flex items-center justify-between gap-2">
                          <span className="text-[#8991a6] capitalize text-[11px]">
                            {header === "whatsapp"
                              ? "WhatsApp"
                              : header === "is_reseller"
                              ? "Partner Status"
                              : header === "usage_limit"
                              ? "Global Limit"
                              : header === "per_user_limit"
                              ? "Limit Per User"
                              : header === "used_count"
                              ? "Times Used"
                              : header === "created_at"
                              ? "Date"
                              : header === "applicable_to"
                              ? "Scope"
                              : header.replaceAll("_", " ")}:
                          </span>
                          <span className="text-white text-right max-w-[65%] truncate">
                            {isIdColumn ? (
                              <CopyIdBadge id={String(val)} />
                            ) : isApplicableTo ? (
                              val === "subscription" ? (
                                <span className="text-[10px] font-bold text-purple-300">Subscriptions Only</span>
                              ) : val === "normal" ? (
                                <span className="text-[10px] font-bold text-blue-300">Normal Games Only</span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-300">All Items</span>
                              )
                            ) : isWhatsapp ? (
                              (() => {
                                const parsed = formatWhatsApp(val);
                                if (!parsed) return <span className="text-[#646b7b]">-</span>;
                                return (
                                  <a
                                    href={parsed.linkUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#20c763]/10 text-[#20c763] border border-[#20c763]/25"
                                  >
                                    <MessageCircle size={11} />
                                    <span>{parsed.display}</span>
                                  </a>
                                );
                              })()
                            ) : (
                              display(val)
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {hasActions && (
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end">
                      <RowActions section={section} row={row} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
      {!filtered.length && (
        <p className="p-10 text-center text-[#8991a6]">
          No records found matching &quot;{query}&quot;.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs font-semibold text-[#8991a6]">
          <span>
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/20 hover:bg-white/[.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8991a6] cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 text-white">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/20 hover:bg-white/[.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8991a6] cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
