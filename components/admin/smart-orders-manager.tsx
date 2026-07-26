"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckSquare, ExternalLink, HelpCircle, Phone, ReceiptText, Trash2, Sparkles, Filter } from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import { cleanupOldDeliveredOrders, deleteSingleOrder, deleteSelectedOrders } from "@/app/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface OrderRow {
  id: number;
  order_reference?: string;
  customer_name?: string;
  customer_whatsapp?: string;
  order_status?: string;
  total_price?: number;
  cart_items?: unknown;
  screenshot_url?: string;
  proof_url?: string;
  created_at: string;
  account_access?: string;
}

export function SmartOrdersManager({ initialOrders }: { initialOrders: OrderRow[] }) {
  const router = useRouter();
  const [period, setPeriod] = useState<"all" | "today" | "week" | "month" | "older">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "delivered" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  // Filter orders based on Period, Status, and Search Query
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();

    return initialOrders.filter((order) => {
      const createdAt = new Date(order.created_at).getTime();

      // Period Filter
      if (period === "today" && createdAt < startOfToday) return false;
      if (period === "week" && createdAt < sevenDaysAgo) return false;
      if (period === "month" && createdAt < startOfMonth) return false;
      if (period === "older" && createdAt >= thirtyDaysAgo) return false;

      // Status Filter
      const status = (order.order_status || "Pending").toLowerCase();
      if (statusFilter === "pending" && (status === "delivered" || status === "rejected")) return false;
      if (statusFilter === "delivered" && status !== "delivered") return false;
      if (statusFilter === "rejected" && status !== "rejected") return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ref = String(order.order_reference || "").toLowerCase();
        const name = String(order.customer_name || "").toLowerCase();
        const phone = String(order.customer_whatsapp || "").toLowerCase();
        const idStr = String(order.id);

        if (!ref.includes(q) && !name.includes(q) && !phone.includes(q) && !idStr.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [initialOrders, period, statusFilter, searchQuery]);

  // Counts for quick metrics
  const oldDeliveredCount = useMemo(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();
    return initialOrders.filter((o) => {
      const status = (o.order_status || "").toLowerCase();
      const createdAt = new Date(o.created_at).getTime();
      return (status === "delivered" || status === "rejected") && createdAt < thirtyDaysAgo;
    }).length;
  }, [initialOrders]);

  const toggleSelectOrder = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const handleCleanupOld = () => {
    if (!oldDeliveredCount) {
      toast.info("No delivered/rejected orders older than 30 days found.");
      return;
    }
    if (!window.confirm(`Delete ${oldDeliveredCount} old delivered/rejected orders older than 30 days? This will keep your orders list clean and fast.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await cleanupOldDeliveredOrders(30);
        toast.success(`Successfully cleaned up ${res.deletedCount} old order(s).`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Cleanup failed.");
      }
    });
  };

  const handleDeleteSingle = (id: number, ref: string) => {
    if (!window.confirm(`Delete order ${ref}? This action cannot be undone.`)) return;

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("id", String(id));
        await deleteSingleOrder(fd);
        toast.success(`Order ${ref} deleted.`);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Deletion failed.");
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected order(s)?`)) return;

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("order_ids", selectedIds.join(","));
        await deleteSelectedOrders(fd);
        toast.success(`Deleted ${selectedIds.length} order(s).`);
        setSelectedIds([]);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Batch deletion failed.");
      }
    });
  };

  return (
    <div className="py-10">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white transition">
        <ArrowLeft size={16} /> Admin home
      </Link>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Smart Order Management</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">Review and Deliver</h1>
          <p className="section-copy">Filter orders by day or month, manage customer delivery details, and auto-cleanup old test orders.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isPending || oldDeliveredCount === 0}
            onClick={handleCleanupOld}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 px-4 text-xs font-bold text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-400" />
            Cleanup Delivered (&gt;30 Days) [{oldDeliveredCount}]
          </button>
          <span className="rounded-md border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-bold">
            {filteredOrders.length} / {initialOrders.length} orders
          </span>
        </div>
      </div>

      <aside className="mt-6 flex gap-3 rounded-md border border-[#8b5cf6]/25 bg-[#8b5cf6]/[.07] p-4 text-sm text-[#cbbfff]">
        <HelpCircle className="mt-0.5 shrink-0" size={18} />
        <div>
          <strong className="text-white">Smart Delivery & Cleanup Protocol</strong>
          <p className="mt-1 leading-6">
            1. Use date tabs (Today, Week, Month) to check incoming orders. 2. Verify payment &amp; send WhatsApp invoice. 3. Delivered orders &gt;30 days old can be cleaned up in 1-click.
          </p>
        </div>
      </aside>

      {/* FILTER CONTROLS TOOLBAR */}
      <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-[#0f0c22]/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Period Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={`rounded-md px-3 py-1.5 font-bold transition cursor-pointer ${period === "all" ? "bg-[#8b5cf6] text-white" : "text-[#a0a8c0] hover:text-white"}`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={`rounded-md px-3 py-1.5 font-bold transition cursor-pointer ${period === "today" ? "bg-[#8b5cf6] text-white" : "text-[#a0a8c0] hover:text-white"}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`rounded-md px-3 py-1.5 font-bold transition cursor-pointer ${period === "week" ? "bg-[#8b5cf6] text-white" : "text-[#a0a8c0] hover:text-white"}`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={`rounded-md px-3 py-1.5 font-bold transition cursor-pointer ${period === "month" ? "bg-[#8b5cf6] text-white" : "text-[#a0a8c0] hover:text-white"}`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriod("older")}
              className={`rounded-md px-3 py-1.5 font-bold transition cursor-pointer ${period === "older" ? "bg-amber-500 text-black" : "text-[#a0a8c0] hover:text-white"}`}
            >
              Older (&gt;30 Days)
            </button>
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#a0a8c0]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-[#8b5cf6]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending / Needs Action</option>
              <option value="delivered">Delivered Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Search & Batch Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <input
            type="text"
            placeholder="Search order ref, customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-64 flex-1 rounded-md border border-white/10 bg-black/50 px-3 py-2 text-xs text-white outline-none placeholder:text-[#6a7288] focus:border-[#8b5cf6]"
          />

          <div className="flex flex-wrap items-center gap-2">
            {filteredOrders.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-[#a0a8c0] hover:text-white transition cursor-pointer"
              >
                <CheckSquare size={13} />
                {selectedIds.length === filteredOrders.length ? "Deselect All" : "Select All"}
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-200 transition hover:bg-red-500/30 cursor-pointer"
              >
                <Trash2 size={13} />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="mt-6 space-y-4">
        {filteredOrders.map((row) => {
          const items = Array.isArray(row.cart_items) ? (row.cart_items as Array<Record<string, unknown>>) : [];
          const gameName = items.length ? items.map((item) => String(item.title || "Game")).join(", ") : "Order items";
          const isSelected = selectedIds.includes(row.id);

          return (
            <article
              key={String(row.id)}
              className={`premium-panel rounded-lg p-5 transition md:p-6 relative ${
                isSelected
                  ? "bg-[#8b5cf6]/15 border-[#8b5cf6]/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                  : "bg-[#0f0c22]/80 border-[#8b5cf6]/20 hover:border-white/15"
              }`}
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(row.id)}
                      className="h-4 w-4 rounded border-white/20 bg-black/50 accent-[#8b5cf6] cursor-pointer"
                    />
                    <strong className="text-lg">{String(row.order_reference || `Order #${row.id}`)}</strong>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-bold ${
                        row.order_status === "Delivered"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : row.order_status === "Verified" || row.order_status === "Processing"
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                          : row.order_status === "Rejected"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {String(row.order_status || "Pending")}
                    </span>
                  </div>

                  <p className="mt-2.5 text-sm text-[#a0a8c0]">
                    {String(row.customer_name)} ·{" "}
                    <span className="inline-flex items-center gap-1 font-mono text-xs">
                      <Calendar size={12} className="text-[#8b5cf6]" />
                      {new Date(String(row.created_at)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#8991a6]">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={13} />
                      {String(row.customer_whatsapp || "No phone")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ReceiptText size={13} />
                      {gameName}
                    </span>
                    <strong className="text-white font-mono">₹{Number(row.total_price || 0).toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                <div className="space-y-3 min-w-56">
                  <div className="flex items-center gap-2">
                    {row.proof_url ? (
                      <a
                        href={row.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary flex-1 text-xs inline-flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink size={14} /> View payment proof
                      </a>
                    ) : (
                      <p className="flex-1 rounded-md border border-amber-400/20 bg-amber-400/[.06] px-3 py-2 text-center text-xs text-amber-200">
                        No payment proof attached
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteSingle(row.id, String(row.order_reference || `#${row.id}`))}
                      title="Delete Order"
                      className="rounded-md border border-red-500/25 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/25 disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <OrderActions
                    id={Number(row.id)}
                    currentStatus={String(row.order_status ?? "Pending")}
                    customerPhone={String(row.customer_whatsapp || "")}
                    gameName={gameName}
                    orderReference={String(row.order_reference || `#${row.id}`)}
                    initialAccountAccess={String(row.account_access || "")}
                    totalPrice={Number(row.total_price || 0)}
                  />
                </div>
              </div>
            </article>
          );
        })}

        {!filteredOrders.length && (
          <div className="premium-panel rounded-lg p-12 text-center border-[#8b5cf6]/20 bg-[#0f0c22]/80">
            <p className="text-[#8991a6] text-sm">No orders matching the selected period or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
