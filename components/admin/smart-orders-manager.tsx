"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckSquare, ExternalLink, HelpCircle, Phone, ReceiptText, Trash2, Sparkles, Filter, Search, RefreshCw, ShieldCheck } from "lucide-react";
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

  // Instant 0ms In-Memory Memoized Filter Engine
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

  // Count delivered or rejected orders older than 30 days
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
    <div className="py-8">
      {/* HEADER BREADCRUMB */}
      <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a0a8c0] hover:text-white transition">
        <ArrowLeft size={15} /> Admin dashboard
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow text-[#b9a4ff]">Fulfillment Control Center</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">Customer Orders &amp; Delivery</h1>
          <p className="mt-2 text-sm text-[#a0a8c0] max-w-2xl leading-relaxed">
            Review payment proofs, deliver game activation access, and auto-cleanup old test orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isPending || oldDeliveredCount === 0}
            onClick={handleCleanupOld}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-orange-500/10 px-4 text-xs font-extrabold uppercase tracking-wider text-amber-200 shadow-lg shadow-amber-500/5 transition hover:border-amber-400/50 hover:bg-amber-400/20 hover:scale-[1.02] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            Auto-Cleanup (&gt;30 Days) [{oldDeliveredCount}]
          </button>

          <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-[#cbbfff]">
            <ShieldCheck size={14} className="text-[#8b5cf6]" />
            <span>{filteredOrders.length} / {initialOrders.length} Orders</span>
          </div>
        </div>
      </div>

      {/* QUICK INSTRUCTION PROTOCOL */}
      <aside className="mt-6 flex gap-3.5 rounded-xl border border-[#8b5cf6]/20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8b5cf6]/15 via-[#0e0b1f]/80 to-[#090715] p-4 text-sm text-[#cbbfff] shadow-xl">
        <HelpCircle className="mt-0.5 shrink-0 text-[#8b5cf6]" size={18} />
        <div>
          <strong className="text-white font-extrabold uppercase tracking-wider text-xs">Standard Fulfillment Workflow</strong>
          <p className="mt-1 leading-6 text-xs text-[#a0a8c0]">
            1. Filter orders by timeframe (Today, Week, Month). 2. Inspect payment screenshot. 3. Click status buttons ("Verify", "Start Delivery", "Mark Delivered") to trigger automatic customer updates and WhatsApp invoice templates.
          </p>
        </div>
      </aside>

      {/* HYPER-PREMIUM DESIGN SYSTEM TOOLBAR */}
      <div className="mt-6 space-y-4 rounded-2xl border border-[#8b5cf6]/25 bg-[#0e0b1f]/90 p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Brand Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#8b5cf6]/10 blur-3xl" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          {/* Custom Sleek Tab Capsules */}
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                period === "all"
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/30"
                  : "text-[#a0a8c0] hover:text-white"
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                period === "today"
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/30"
                  : "text-[#a0a8c0] hover:text-white"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                period === "week"
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/30"
                  : "text-[#a0a8c0] hover:text-white"
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                period === "month"
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/30"
                  : "text-[#a0a8c0] hover:text-white"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriod("older")}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                period === "older"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-lg shadow-amber-500/20"
                  : "text-[#a0a8c0] hover:text-amber-300"
              }`}
            >
              Older (&gt;30d)
            </button>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center">
              <Filter size={13} className="absolute left-3 text-[#8b5cf6] pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none rounded-xl border border-[#8b5cf6]/30 bg-[#090715] pl-9 pr-9 py-2 text-xs font-bold text-white outline-none transition focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] shadow-inner cursor-pointer"
              >
                <option value="all">All Order Statuses</option>
                <option value="pending">Pending / In Progress</option>
                <option value="delivered">Delivered Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Integrated Search & Selection Control */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 relative z-10">
          <div className="relative min-w-72 flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a7288]" />
            <input
              type="text"
              placeholder="Search reference, customer name, phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#090715] pl-10 pr-4 py-2.5 text-xs text-white outline-none placeholder:text-[#5a6278] focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] shadow-inner transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filteredOrders.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-[#a0a8c0] hover:border-white/20 hover:text-white transition cursor-pointer"
              >
                <CheckSquare size={13} className="text-[#8b5cf6]" />
                {selectedIds.length === filteredOrders.length ? "Deselect All" : "Select All"}
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/20 px-3.5 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/30 cursor-pointer shadow-lg shadow-red-500/10"
              >
                <Trash2 size={13} />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ORDERS CARDS LIST */}
      <div className="mt-6 space-y-4">
        {filteredOrders.map((row) => {
          const items = Array.isArray(row.cart_items) ? (row.cart_items as Array<Record<string, unknown>>) : [];
          const gameName = items.length ? items.map((item) => String(item.title || "Game")).join(", ") : "Order items";
          const isSelected = selectedIds.includes(row.id);

          return (
            <article
              key={String(row.id)}
              className={`premium-panel rounded-2xl p-5 transition-all md:p-6 relative overflow-hidden ${
                isSelected
                  ? "bg-[#8b5cf6]/15 border-[#8b5cf6]/60 shadow-[0_0_25px_rgba(139,92,246,0.2)]"
                  : "bg-[#0f0c22]/80 border-[#8b5cf6]/20 hover:border-white/20 hover:shadow-xl"
              }`}
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(row.id)}
                      className="h-4 w-4 rounded border-white/20 bg-black/60 accent-[#8b5cf6] cursor-pointer"
                    />
                    <strong className="text-lg font-black tracking-wide text-white">{String(row.order_reference || `Order #${row.id}`)}</strong>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-bold ${
                        row.order_status === "Delivered"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-500/10"
                          : row.order_status === "Verified" || row.order_status === "Processing"
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-300 shadow-sm shadow-sky-500/10"
                          : row.order_status === "Rejected"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {String(row.order_status || "Pending")}
                    </span>
                  </div>

                  <p className="mt-2.5 text-sm text-[#a0a8c0]">
                    <strong className="text-white font-medium">{String(row.customer_name)}</strong> ·{" "}
                    <span className="inline-flex items-center gap-1 font-mono text-xs">
                      <Calendar size={12} className="text-[#8b5cf6]" />
                      {new Date(String(row.created_at)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-3.5 text-xs text-[#8991a6]">
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <Phone size={13} className="text-[#8b5cf6]" />
                      {String(row.customer_whatsapp || "No phone")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ReceiptText size={13} className="text-[#8b5cf6]" />
                      {gameName}
                    </span>
                    <strong className="text-white font-mono font-extrabold text-sm">₹{Number(row.total_price || 0).toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                <div className="space-y-3 min-w-60">
                  <div className="flex items-center gap-2">
                    {row.proof_url ? (
                      <a
                        href={row.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary flex-1 text-xs inline-flex items-center justify-center gap-1.5 border-[#8b5cf6]/30 hover:border-[#8b5cf6]"
                      >
                        <ExternalLink size={14} /> View payment proof
                      </a>
                    ) : (
                      <p className="flex-1 rounded-lg border border-amber-400/20 bg-amber-400/[.06] px-3 py-2 text-center text-xs font-semibold text-amber-200">
                        No payment proof attached
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteSingle(row.id, String(row.order_reference || `#${row.id}`))}
                      title="Delete Order"
                      className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/25 hover:border-red-500/50 disabled:opacity-40 cursor-pointer"
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
          <div className="premium-panel rounded-2xl p-14 text-center border-[#8b5cf6]/20 bg-[#0f0c22]/80">
            <p className="text-[#8991a6] text-sm font-medium">No orders matching the selected period or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
