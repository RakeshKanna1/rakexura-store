"use client";

import { useState } from "react";
import { Search, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { OrderActions } from "@/components/admin/order-actions";
import { DeleteCustomerButton } from "@/components/admin/delete-customer-button";
import { archiveGame, moderateProof, moderateReview, toggleCoupon, updateRequestStatus, toggleFlashSale, deleteFlashSale, toggleCampaign, deleteCampaign, deleteCampaignGame } from "@/app/admin/actions";

type AdminRow = Record<string, unknown> & { id?: number | string; screenshot_url?: string; proof_url?: string; media_urls?: string[]; media_links?: string[] };

function SubmitButton({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "positive" | "danger" }) {
  const color = tone === "positive" ? "border-[#00d68f]/30 text-[#70efbb]" : tone === "danger" ? "border-red-400/30 text-red-300 hover:bg-red-500/10" : "border-white/10 text-[#c8cedc]";
  return <button type="submit" className={`rounded border bg-black/20 px-3 py-2 text-xs font-bold transition hover:bg-white/[.06] cursor-pointer ${color}`}>{children}</button>;
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
  if (section === "coupons") return <div className="flex gap-2"><Link href={`/admin/coupons?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc]">Edit</Link><form action={toggleCoupon}><input type="hidden" name="id" value={id} /><input type="hidden" name="active" value={String(!row.active)} /><SubmitButton tone={row.active ? "danger" : "positive"}>{row.active ? "Disable" : "Enable"}</SubmitButton></form></div>;
  if (section === "support") return <Link href={`/dashboard/support/${id}`} className="inline-flex min-h-9 items-center gap-2 rounded border border-white/10 bg-black/20 px-3 text-xs font-bold text-[#f8e38a]"><ExternalLink size={13} /> Open conversation</Link>;
  if (section === "games") return <div className="flex gap-2"><Link href={`/admin/games?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc]">Edit</Link><form action={archiveGame}><input type="hidden" name="id" value={id} /><input type="hidden" name="archived" value={String(!row.archived)} /><SubmitButton tone={row.archived ? "positive" : "danger"}>{row.archived ? "Restore" : "Archive"}</SubmitButton></form></div>;
  if (section === "media") return <div className="flex gap-2">{!row.approved && <form action={moderateProof}><input type="hidden" name="id" value={id} /><input type="hidden" name="decision" value="approve" /><SubmitButton tone="positive">Approve</SubmitButton></form>}<form action={moderateProof}><input type="hidden" name="id" value={id} /><input type="hidden" name="decision" value="delete" /><SubmitButton tone="danger">Delete</SubmitButton></form></div>;
  if (section === "flash-sales") return <div className="flex gap-2"><Link href={`/admin/flash-sales?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc]">Edit</Link><form action={toggleFlashSale}><input type="hidden" name="id" value={id} /><input type="hidden" name="active" value={String(!row.active)} /><SubmitButton tone={row.active ? "danger" : "positive"}>{row.active ? "Disable" : "Enable"}</SubmitButton></form><form action={deleteFlashSale}><input type="hidden" name="id" value={id} /><SubmitButton tone="danger">Delete</SubmitButton></form></div>;
  if (section === "campaigns") return <div className="flex gap-2"><Link href={`/admin/campaigns?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc]">Edit</Link><form action={toggleCampaign}><input type="hidden" name="id" value={id} /><input type="hidden" name="active" value={String(!row.active)} /><SubmitButton tone={row.active ? "danger" : "positive"}>{row.active ? "Disable" : "Enable"}</SubmitButton></form><form action={deleteCampaign}><input type="hidden" name="id" value={id} /><SubmitButton tone="danger">Delete</SubmitButton></form></div>;
  if (section === "campaign-games") return <div className="flex gap-2"><Link href={`/admin/campaign-games?edit=${id}`} className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#c8cedc]">Edit</Link><form action={deleteCampaignGame}><input type="hidden" name="id" value={id} /><SubmitButton tone="danger">Delete</SubmitButton></form></div>;
  return null;
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function SearchableTable({ rows, headers, section, hasActions }: { rows: AdminRow[]; headers: string[]; section: string; hasActions: boolean }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const filtered = rows.filter((row) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return headers.some((header) => {
      const val = row[header];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(q);
    });
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex max-w-md items-center gap-3 rounded-md border border-white/10 bg-black/25 px-4 py-1 text-sm outline-none focus-within:border-[#8b5cf6]">
        <Search size={16} className="text-[#8991a6] shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={`Search ${section}...`}
          className="h-10 w-full bg-transparent outline-none placeholder:text-[#767e90] text-white"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-[#8b5cf6]/20">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-white/[.04] text-[#8991a6]">
            <tr>
              {headers.map((header) => (
                <th key={header} className="p-4 capitalize">
                  {header === "usage_limit" ? "Global Limit" : header === "per_user_limit" ? "Limit Per User" : header === "used_count" ? "Times Used" : header.replaceAll("_", " ")}
                </th>
              ))}
              {hasActions && <th className="p-4">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, index) => (
              <tr key={String(row.id ?? index)} className="border-t border-white/[.07] hover:bg-white/[.025]">
                {headers.map((header) => (
                  <td key={header} className="max-w-72 truncate p-4">
                    {display(row[header])}
                  </td>
                ))}
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
