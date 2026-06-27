"use client";

import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import Link from "next/link";
import { OrderActions } from "@/components/admin/order-actions";
import { archiveGame, moderateProof, moderateReview, toggleCoupon, updateRequestStatus } from "@/app/admin/actions";

type AdminRow = Record<string, any> & { id?: number; screenshot_url?: string; proof_url?: string; media_urls?: string[]; media_links?: string[] };

function SubmitButton({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "positive" | "danger" }) {
  const color = tone === "positive" ? "border-[#00d68f]/30 text-[#70efbb]" : tone === "danger" ? "border-red-400/30 text-red-300" : "border-white/10 text-[#c8cedc]";
  return <button type="submit" className={`rounded border bg-black/20 px-3 py-2 text-xs font-bold transition hover:bg-white/[.06] ${color}`}>{children}</button>;
}

function RowActions({ section, row }: { section: string; row: AdminRow }) {
  const id = Number(row.id);
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

  const filtered = rows.filter((row) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return headers.some((header) => {
      const val = row[header];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(q);
    });
  });

  return (
    <div className="space-y-4">
      <div className="flex max-w-md items-center gap-3 rounded-md border border-white/10 bg-black/25 px-4 py-1 text-sm outline-none focus-within:border-[#8b5cf6]">
        <Search size={16} className="text-[#8991a6] shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
                  {header === "usage_limit" ? "Global Stock (Usage Limit)" : header.replaceAll("_", " ")}
                </th>
              ))}
              {hasActions && <th className="p-4">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
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
          No records found matching "{query}".
        </p>
      )}
    </div>
  );
}
