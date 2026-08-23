"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Calendar, CheckSquare, ExternalLink, HelpCircle, Phone, ReceiptText, Trash2, Filter, Search } from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import { cleanupOldDeliveredOrders, deleteSingleOrder, deleteSelectedOrders } from "@/app/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { matchesSearchQuery } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [period, setPeriod] = useState<"all" | "today" | "week" | "month" | "older">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "delivered" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  // Sync state if initialOrders prop changes from server
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Real-time live synchronization with Supabase orders table
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-orders-realtime-listener")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  // Instant In-Memory Filter Engine (0ms execution time)
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();

    return orders.filter((order) => {
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
        const ref = String(order.order_reference || "");
        const name = String(order.customer_name || "");
        const phone = String(order.customer_whatsapp || "");
        const idStr = String(order.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = Array.isArray(order.cart_items) ? (order.cart_items as any[]) : [];
        const itemTitles = items.map((i) => String(i?.title || i?.name || "")).join(" ");

        const matchesAny =
          matchesSearchQuery(ref, searchQuery) ||
          matchesSearchQuery(name, searchQuery) ||
          matchesSearchQuery(phone, searchQuery) ||
          matchesSearchQuery(idStr, searchQuery) ||
          (itemTitles ? matchesSearchQuery(itemTitles, searchQuery) : false);

        if (!matchesAny) return false;
      }

      return true;
    });
  }, [orders, period, statusFilter, searchQuery]);

  // Count of old delivered orders eligible for 1-click purge (> 30 days)
  const oldDeliveredCount = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const status = (o.order_status || "").toLowerCase();
      const isDone = status === "delivered" || status === "rejected";
      const isOld = new Date(o.created_at).getTime() < thirtyDaysAgo;
      return isDone && isOld;
    }).length;
  }, [orders]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCleanupOld = () => {
    if (!oldDeliveredCount) {
      toast.info("No delivered/rejected orders older than 30 days found.");
      return;
    }
    if (!window.confirm(`Delete ${oldDeliveredCount} old delivered/rejected orders older than 30 days? This keeps your database clean and fast.`)) {
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
    <div className="py-2 md:py-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Smart Order Management</p>
          <h1 className="mt-2 text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">
            Review and Deliver
          </h1>
          <p className="section-copy text-xs sm:text-sm text-[#8991a6] mt-1">
            Filter orders by day or month, manage customer delivery details, and auto-cleanup old test orders.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            suppressHydrationWarning
            type="button"
            disabled={isPending || oldDeliveredCount === 0}
            onClick={handleCleanupOld}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#a0a8c0] transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Trash2 size={13} className="text-[#8b5cf6]" />
            <span>Purge Old (30+ Days)</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white">{oldDeliveredCount}</span>
          </button>
          <span className="rounded-md border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs font-bold text-white">
            {filteredOrders.length} / {initialOrders.length} orders
          </span>
        </div>
      </div>

      <aside className="mt-4 flex gap-3 rounded-lg border border-[#8b5cf6]/25 bg-[#8b5cf6]/[.07] p-3 sm:p-4 text-xs sm:text-sm text-[#cbbfff]">
        <HelpCircle className="mt-0.5 shrink-0" size={16} />
        <div>
          <strong className="text-white">Smart Delivery &amp; Cleanup Protocol</strong>
          <p className="mt-0.5 leading-relaxed text-xs text-[#cbbfff]/80">
            1. Filter incoming orders. 2. Verify payment &amp; dispatch activation details. 3. Completed orders older than 30 days can be cleaned up in 1-click.
          </p>
        </div>
      </aside>

      {/* FILTER CONTROLS */}
      <div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-[#0c0919] p-3 sm:p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Period Tabs */}
          <div className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-black/50 p-1 text-xs">
            {(["all", "today", "week", "month", "older"] as const).map((p) => {
              const labels = {
                all: "All Time",
                today: "Today",
                week: "This Week",
                month: "This Month",
                older: "Older (30d+)",
              };
              const isSelected = period === p;
              return (
                <button
                  suppressHydrationWarning
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded px-2.5 py-1.5 font-bold transition cursor-pointer flex-1 sm:flex-initial text-center ${
                    isSelected
                      ? p === "older"
                        ? "bg-amber-500 text-black font-extrabold shadow-sm"
                        : "bg-[#8b5cf6] text-white shadow-sm"
                      : "text-[#a0a8c0] hover:text-white"
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2 min-w-0">
            <Filter size={14} className="text-[#a0a8c0] shrink-0" />
            <select
              suppressHydrationWarning
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "delivered" | "rejected")}
              className="w-full sm:w-auto rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white outline-none focus:border-[#8b5cf6] cursor-pointer"
            >
              <option value="all">All Order Statuses</option>
              <option value="pending">Pending / Needs Action</option>
              <option value="delivered">Delivered Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Search & Batch Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative w-full sm:flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a7288]" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search reference, customer name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/50 pl-9 pr-3 py-2 text-xs text-white outline-none placeholder:text-[#6a7288] focus:border-[#8b5cf6]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filteredOrders.length > 0 && (
              <button
                suppressHydrationWarning
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#a0a8c0] hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
              >
                <CheckSquare size={13} />
                <span>{selectedIds.length === filteredOrders.length ? "Deselect All" : "Select All"}</span>
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                suppressHydrationWarning
                type="button"
                disabled={isPending}
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="mt-5 space-y-4">
        {filteredOrders.map((row) => {
          const items = Array.isArray(row.cart_items) ? (row.cart_items as Array<Record<string, unknown>>) : [];
          const gameName = items.length ? items.map((item) => String(item.title || "Game")).join(", ") : "Order items";
          const isSelected = selectedIds.includes(row.id);

          return (
            <article
              key={String(row.id)}
              className={`premium-panel rounded-lg p-4 sm:p-5 md:p-6 transition relative ${
                isSelected
                  ? "bg-[#8b5cf6]/15 border-[#8b5cf6]/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                  : "bg-[#0f0c22]/80 border-[#8b5cf6]/20 hover:border-white/15"
              }`}
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
                <div className="min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <input
                      suppressHydrationWarning
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(row.id)}
                      className="h-4 w-4 rounded border-white/20 bg-black/50 accent-[#8b5cf6] cursor-pointer"
                    />
                    <strong className="text-base sm:text-lg font-black text-white">{String(row.order_reference || `Order #${row.id}`)}</strong>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
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

                  <p className="text-xs sm:text-sm text-[#a0a8c0]">
                    <strong className="text-white">{String(row.customer_name)}</strong> ·{" "}
                    <span className="inline-flex items-center gap-1 font-mono text-xs">
                      <Calendar size={12} className="text-[#8b5cf6]" />
                      {new Date(String(row.created_at)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-[#8991a6] pt-1 border-t border-white/[0.06]">
                    <span className="inline-flex items-center gap-1.5 text-zinc-300">
                      <Phone size={12} className="text-[#20c763]" />
                      {String(row.customer_whatsapp || "No phone")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-zinc-300">
                      <ReceiptText size={12} className="text-[#8b5cf6]" />
                      {gameName}
                    </span>
                    <strong className="text-white font-mono font-bold">₹{Number(row.total_price || 0).toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                <div className="space-y-3 pt-2 xl:pt-0 border-t xl:border-t-0 border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    {row.proof_url ? (
                      <a
                        href={row.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary flex-1 text-xs inline-flex items-center justify-center gap-1.5 py-2"
                      >
                        <ExternalLink size={13} /> View payment proof
                      </a>
                    ) : (
                      <p className="flex-1 rounded-md border border-amber-400/20 bg-amber-400/[.06] px-3 py-1.5 text-center text-xs text-amber-200">
                        No payment proof
                      </p>
                    )}

                    <button
                      suppressHydrationWarning
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteSingle(row.id, String(row.order_reference || `#${row.id}`))}
                      title="Delete Order"
                      className="rounded-md border border-red-500/25 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/25 disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
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
          <div className="premium-panel rounded-lg p-10 text-center border-[#8b5cf6]/20 bg-[#0f0c22]/80">
            <p className="text-[#8991a6] text-sm">No orders matching the selected period or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
