"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Search, ExternalLink, ChevronLeft, ChevronRight, Copy, Check, Gamepad2, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { assetUrl, matchesSearchQuery } from "@/lib/utils";
import { OrderActions } from "@/components/admin/order-actions";
import { DeleteCustomerButton } from "@/components/admin/delete-customer-button";
import { archiveGame, moderateProof, moderateReview, toggleCoupon, deleteCoupon, updateRequestStatus, toggleFlashSale, deleteFlashSale, toggleCampaign, deleteCampaign, deleteCampaignGame } from "@/app/admin/actions";

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
    const isAdmin = row.role === "admin";
    if (isAdmin) return <span className="text-[11px] font-bold text-[#b9a4ff]">Admin Profile</span>;
    return <DeleteCustomerButton userId={customerId} customerName={String(row.display_name || "")} />;
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

  return (
    <div className="space-y-4">
      <div className="flex max-w-md items-center gap-3 rounded-md border border-white/10 bg-black/25 px-4 py-1 text-sm outline-none focus-within:border-white/30">
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

      {section === "games" ? (
        <div className="overflow-x-auto rounded-md border border-white/10">
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
                          <Zap size={12} className="text-[#facc15]" />
                          Subscription
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/40 text-[#8991a6] border border-white/10">
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
      ) : (
        <div className="overflow-x-auto rounded-md border border-[#8b5cf6]/20">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-white/[.04] text-[#8991a6]">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="p-4 capitalize">
                    {header === "usage_limit" ? "Global Limit" : header === "per_user_limit" ? "Limit Per User" : header === "used_count" ? "Times Used" : header === "created_at" ? "Created At (12h)" : header === "applicable_to" ? "Scope / Target" : header.replaceAll("_", " ")}
                  </th>
                ))}
                {hasActions && <th className="p-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, index) => (
                <tr key={String(row.id ?? index)} className="border-t border-white/[.07] hover:bg-white/[.025]">
                  {headers.map((header) => {
                    const isCodeColumn = section === "coupons" && header === "code";
                    const isApplicableToColumn = section === "coupons" && header === "applicable_to";
                    const val = row[header];
                    const lowerHeader = header.toLowerCase();
                    const isIdColumn = (lowerHeader === "id" || lowerHeader.endsWith("_id") || lowerHeader === "visitor_id") && typeof val === "string" && val.length > 10;

                    return (
                      <td key={header} className="max-w-72 truncate p-4">
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              Subscriptions Only
                            </span>
                          ) : val === "normal" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              Normal Games Only
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              All Items (Both)
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
                    <td className="p-4">
                      <RowActions section={section} row={row} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
