"use client";

import { useEffect, useState } from "react";
import { Users, Eye, Smartphone, Monitor, Globe, Compass, RefreshCw, ArrowUpRight, Activity, ChevronDown, ChevronUp, Layers, ListFilter, Trash2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cleanupVisitorLogsAction } from "@/app/admin/actions";
import { toast } from "sonner";

type VisitorLog = {
  id: string;
  visitor_id: string;
  user_name: string | null;
  user_email: string | null;
  path: string;
  referrer: string | null;
  device_type: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
};

type VisitorSession = {
  visitor_id: string;
  user_name: string | null;
  user_email: string | null;
  latest_time: string;
  device_type: string | null;
  referrer: string | null;
  ip_address: string | null;
  pages: string[];
  total_hits: number;
};

export function VisitorAnalytics() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [viewMode, setViewMode] = useState<"grouped" | "raw">("grouped");
  const [filterType, setFilterType] = useState<"all" | "customers" | "admin">("all");
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [isPruning, setIsPruning] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);

  async function handlePrune() {
    if (!confirm(`Are you sure you want to delete visitor logs older than ${retentionDays} days? This will permanently free up Supabase database storage.`)) {
      return;
    }
    setIsPruning(true);
    try {
      const formData = new FormData();
      formData.append("retention_days", String(retentionDays));
      const result = await cleanupVisitorLogsAction(formData);
      toast.success(`Retention cleanup complete: pruned ${result.count ?? 0} logs older than ${retentionDays} days.`);
      await fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to prune visitor logs.");
    } finally {
      setIsPruning(false);
    }
  }

  async function fetchLogs() {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data } = await supabase
        .from("visitor_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);

      if (data) {
        setLogs(data as VisitorLog[]);
      }

      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: activeData } = await supabase
        .from("visitor_logs")
        .select("visitor_id")
        .gte("created_at", fiveMinsAgo);

      if (activeData) {
        const uniqueActive = new Set(activeData.map((item: { visitor_id: string }) => item.visitor_id));
        setActiveCount(uniqueActive.size);
      }
    } catch (err) {
      console.error("Failed to load visitor analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalPageviews = logs.length;
  const uniqueVisitors = new Set(logs.map((l) => l.visitor_id)).size;
  const mobileCount = logs.filter((l) => l.device_type === "Mobile" || l.device_type === "Tablet").length;
  const mobilePercent = totalPageviews > 0 ? Math.round((mobileCount / totalPageviews) * 100) : 0;
  const desktopPercent = 100 - mobilePercent;

  // Group logs into user sessions
  const sessionsMap: Record<string, VisitorSession> = {};
  logs.forEach((log) => {
    const key = log.visitor_id;
    if (!sessionsMap[key]) {
      sessionsMap[key] = {
        visitor_id: log.visitor_id,
        user_name: log.user_name,
        user_email: log.user_email,
        latest_time: log.created_at,
        device_type: log.device_type,
        referrer: log.referrer,
        ip_address: log.ip_address,
        pages: [log.path],
        total_hits: 1,
      };
    } else {
      sessionsMap[key].pages.push(log.path);
      sessionsMap[key].total_hits += 1;
      if (!sessionsMap[key].user_name && log.user_name) {
        sessionsMap[key].user_name = log.user_name;
      }
    }
  });

  const sessions = Object.values(sessionsMap).sort(
    (a, b) => new Date(b.latest_time).getTime() - new Date(a.latest_time).getTime()
  );

  const adminSessions = sessions.filter((s) => s.user_name?.startsWith("Admin"));
  const customerSessions = sessions.filter((s) => !s.user_name?.startsWith("Admin"));

  const filteredSessions =
    filterType === "customers"
      ? customerSessions
      : filterType === "admin"
      ? adminSessions
      : sessions;

  const filteredLogs =
    filterType === "customers"
      ? logs.filter((l) => !l.user_name?.startsWith("Admin"))
      : filterType === "admin"
      ? logs.filter((l) => l.user_name?.startsWith("Admin"))
      : logs;

  const toggleExpand = (visitorId: string) => {
    setExpandedSessions((prev) => ({ ...prev, [visitorId]: !prev[visitorId] }));
  };

  // Top pages breakdown
  const pageMap: Record<string, number> = {};
  logs.forEach((l) => {
    pageMap[l.path] = (pageMap[l.path] || 0) + 1;
  });
  const topPages = Object.entries(pageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top referrers breakdown
  const refMap: Record<string, number> = {};
  logs.forEach((l) => {
    const raw = l.referrer || "Direct";
    const src = raw.startsWith("Direct") ? "Direct" : raw;
    refMap[src] = (refMap[src] || 0) + 1;
  });
  const topReferrers = Object.entries(refMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-gradient-to-r from-[#0d0924] via-[#120e2e] to-[#0d0924] p-4 sm:p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border border-[#00d68f]/30 bg-[#00d68f]/10 text-[#00d68f]">
            <Activity size={22} className="sm:w-6 sm:h-6" />
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h2 className="text-xl sm:text-2xl font-black text-white">Live Visitor Monitor</h2>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-black text-emerald-400 whitespace-nowrap shrink-0">
                REAL-TIME
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8991a6]">
              Tracking anonymous visitors and logged-in customer activity across Rakexura.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3">
          {/* Streamlined Live Active Counter Badge & Refresh button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex h-10 flex-1 sm:flex-initial items-center justify-between sm:justify-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-emerald-400">Online:</span>
              </div>
              <strong className="font-black text-white whitespace-nowrap">{activeCount} Visitor{activeCount !== 1 ? "s" : ""}</strong>
            </div>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-white transition hover:bg-white/10 cursor-pointer"
              title="Refresh analytics"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-[#8b5cf6]" : ""} />
            </button>
          </div>

          {/* Retention & Storage Cleanup Control */}
          <div className="flex h-10 w-full sm:w-auto items-center justify-between sm:justify-start gap-2 rounded-lg border border-white/10 bg-black/40 px-3 text-xs">
            <div className="flex items-center gap-1.5 text-[#8991a6] whitespace-nowrap" title="Automatic retention policy prevents Supabase storage bloat">
              <ShieldCheck size={14} className="text-[#00d68f] shrink-0" />
              <span className="font-semibold text-white whitespace-nowrap">Auto-prune:</span>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="rounded bg-black/60 border border-white/10 px-1.5 py-0.5 text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
            <button
              onClick={handlePrune}
              disabled={isPruning || loading}
              className="flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              title="Prune logs older than selected days"
            >
              <Trash2 size={12} className={isPruning ? "animate-spin" : ""} />
              <span>{isPruning ? "Pruning..." : "Prune Now"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-4 sm:p-5">
          <div className="flex items-center justify-between text-[#8b5cf6] mb-3">
            <Eye size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Total Views</span>
          </div>
          <strong className="block text-xl sm:text-2xl font-black text-white">{totalPageviews}</strong>
          <span className="mt-1 block text-[11px] sm:text-xs text-[#8991a6]">Recent Page Views</span>
        </div>

        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-4 sm:p-5">
          <div className="flex items-center justify-between text-[#facc15] mb-3">
            <Users size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Unique Users</span>
          </div>
          <strong className="block text-xl sm:text-2xl font-black text-white">{uniqueVisitors}</strong>
          <span className="mt-1 block text-[11px] sm:text-xs text-[#8991a6]">Active Visitor Sessions</span>
        </div>

        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-4 sm:p-5">
          <div className="flex items-center justify-between text-[#20c763] mb-3">
            <Smartphone size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Mobile Share</span>
          </div>
          <strong className="block text-xl sm:text-2xl font-black text-white">{mobilePercent}%</strong>
          <span className="mt-1 block text-[11px] sm:text-xs text-[#8991a6]">Mobile & Tablet Users</span>
        </div>

        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-4 sm:p-5">
          <div className="flex items-center justify-between text-[#00d68f] mb-3">
            <Monitor size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Desktop Share</span>
          </div>
          <strong className="block text-xl sm:text-2xl font-black text-white">{desktopPercent}%</strong>
          <span className="mt-1 block text-[11px] sm:text-xs text-[#8991a6]">Desktop PC Users</span>
        </div>
      </div>

      {/* Top Pages & Referrers Grid */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Compass size={18} className="text-[#8b5cf6]" />
            <h3 className="text-sm sm:text-base font-bold text-white">Most Popular Pages</h3>
          </div>
          <div className="space-y-2.5">
            {topPages.map(([path, count]) => (
              <div key={path} className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/30 p-2.5 sm:p-3 text-xs">
                <span className="font-mono text-white truncate flex-1 min-w-0" title={path}>{path}</span>
                <span className="rounded bg-[#8b5cf6]/20 px-2 py-0.5 font-bold text-[#b9a4ff] shrink-0 whitespace-nowrap">{count} views</span>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-[#facc15]" />
            <h3 className="text-sm sm:text-base font-bold text-white">Traffic Acquisition Sources</h3>
          </div>
          <div className="space-y-2.5">
            {topReferrers.map(([src, count]) => (
              <div key={src} className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/30 p-2.5 sm:p-3 text-xs">
                <span className="font-semibold text-white truncate flex-1 min-w-0" title={src}>{src}</span>
                <span className="rounded bg-[#facc15]/20 px-2 py-0.5 font-bold text-[#facc15] shrink-0 whitespace-nowrap">{count} visits</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Visitor Feed Stream */}
      <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Visitor Activity Stream</h3>
            <p className="text-xs text-[#8991a6]">Grouped by customer sessions to avoid duplicate rows when users browse multiple pages.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-w-full">
            {/* Audience Segment Filter */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1 text-xs max-w-full overflow-x-auto hide-scrollbar">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap ${
                  filterType === "all" ? "bg-white/20 text-white" : "text-[#8991a6] hover:text-white"
                }`}
              >
                All ({sessions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("customers")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap ${
                  filterType === "customers" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-[#8991a6] hover:text-white"
                }`}
              >
                Customers Only ({customerSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("admin")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap ${
                  filterType === "admin" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-[#8991a6] hover:text-white"
                }`}
              >
                Admin Activity ({adminSessions.length})
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1 text-xs whitespace-nowrap">
              <button
                onClick={() => setViewMode("grouped")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition-colors ${
                  viewMode === "grouped" ? "bg-[#8b5cf6] text-white" : "text-[#8991a6] hover:text-white"
                }`}
              >
                <Layers size={13} /> Grouped ({filteredSessions.length})
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-bold transition-colors ${
                  viewMode === "raw" ? "bg-[#8b5cf6] text-white" : "text-[#8991a6] hover:text-white"
                }`}
              >
                <ListFilter size={13} /> All Hits ({filteredLogs.length})
              </button>
            </div>
          </div>
        </div>

        {/* Grouped View */}
        {viewMode === "grouped" ? (
          <div className="space-y-3">
            {filteredSessions.map((sess) => {
              const isExpanded = Boolean(expandedSessions[sess.visitor_id]);
              const latestPage = sess.pages[0];
              const isAdmin = sess.user_name?.startsWith("Admin");
              return (
                <div key={sess.visitor_id} className="rounded-lg border border-white/10 bg-black/30 overflow-hidden transition-colors">
                  <div
                    onClick={() => toggleExpand(sess.visitor_id)}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-bold text-sm ${isAdmin ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "bg-[#8b5cf6]/10 text-[#b9a4ff]"}`}>
                        {isAdmin ? <ShieldCheck size={18} /> : sess.user_name ? <Users size={18} /> : <Globe size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {sess.user_name ? (
                            <div className="flex items-center gap-1.5">
                              {isAdmin && (
                                <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 whitespace-nowrap">
                                  ADMIN
                                </span>
                              )}
                              <strong className={`truncate ${isAdmin ? "text-amber-300 font-bold" : "text-[#70efbb] font-bold"}`}>
                                {sess.user_name}
                              </strong>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 font-semibold text-white flex-wrap text-xs">
                              <span>Guest</span>
                              <span className="text-white/30 font-normal">•</span>
                              <span className="text-[#8991a6] font-normal">{sess.device_type || "Visitor"}</span>
                              {sess.referrer && !sess.referrer.includes("Direct") && (
                                <span className="rounded bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 px-1.5 py-0.5 text-[10px] text-[#b9a4ff] font-bold truncate max-w-[120px]">
                                  {sess.referrer}
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-[#60697f]">#{sess.visitor_id.slice(-5)}</span>
                            </div>
                          )}
                          <span className="rounded bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 px-2 py-0.5 text-[10px] font-black text-[#b9a4ff] whitespace-nowrap">
                            {sess.total_hits} page{sess.total_hits > 1 ? "s" : ""} visited
                          </span>
                        </div>
                        <span className="text-xs text-[#8991a6] block truncate mt-0.5">
                          Latest page: <code className="text-white font-mono">{latestPage === "/" ? "Home (/)" : latestPage}</code>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 text-xs text-[#8991a6] w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                      <span className="font-semibold text-white inline-flex items-center gap-1.5 shrink-0">
                        {sess.device_type === "Mobile" ? <Smartphone size={14} /> : <Monitor size={14} />}
                        {sess.device_type || "Desktop"}
                      </span>
                      <span className="rounded bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white shrink-0 truncate max-w-[110px] sm:max-w-none">
                        {sess.referrer?.startsWith("Direct") ? "Direct" : (sess.referrer || "Direct")}
                      </span>
                      <span className="font-mono text-[11px] shrink-0 whitespace-nowrap">
                        {new Date(sess.latest_time).toLocaleDateString("en-US", { month: "short", day: "numeric" })},{" "}
                        {new Date(sess.latest_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
                    </div>
                  </div>

                  {/* Expanded Pages List */}
                  {isExpanded && (
                    <div className="border-t border-white/10 bg-black/50 p-4 space-y-2 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6] mb-2">
                        Pages visited in this session ({sess.pages.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sess.pages.map((p, idx) => (
                          <a
                            key={idx}
                            href={p}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/10 hover:text-[#b9a4ff] transition"
                          >
                            <span className="text-[10px] text-[#656d82] font-mono">#{sess.pages.length - idx}</span>
                            <span className="font-mono">{p === "/" ? "Home (/)" : p}</span>
                            <ArrowUpRight size={12} className="text-[#8991a6]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSessions.length === 0 && !loading && (
              <div className="py-8 text-center text-xs text-[#8991a6]">
                {filterType === "customers" ? "No customer sessions recorded yet" : filterType === "admin" ? "No admin activity recorded yet" : "No visitor sessions recorded yet"}
              </div>
            )}
          </div>
        ) : (
          /* Raw Un-grouped View */
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[#8991a6]">
                  <th className="p-3">Date & Time (12h)</th>
                  <th className="p-3">Visitor / Customer</th>
                  <th className="p-3">Page Visited</th>
                  <th className="p-3">Device</th>
                  <th className="p-3">Traffic Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredLogs.map((log) => {
                  const isAdmin = log.user_name?.startsWith("Admin");
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono text-[#8991a6] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })},{" "}
                        {new Date(log.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                      </td>
                      <td className="p-3">
                        {log.user_name ? (
                          <span className={`font-bold inline-flex items-center gap-1.5 ${isAdmin ? "text-amber-300" : "text-[#70efbb]"}`}>
                            {isAdmin ? (
                              <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-300">
                                ADMIN
                              </span>
                            ) : (
                              <Users size={12} />
                            )}
                            {log.user_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-white">
                            <span className="font-medium">Guest</span>
                            <span className="text-[#8991a6] text-[11px]">({log.device_type || "Visitor"})</span>
                            <span className="font-mono text-[10px] text-[#60697f]">#{log.visitor_id.slice(-5)}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <a href={log.path} target="_blank" rel="noreferrer" className="font-mono text-white hover:text-[#8b5cf6] underline flex items-center gap-1">
                          {log.path === "/" ? "Home (/)" : log.path} <ArrowUpRight size={12} />
                        </a>
                      </td>
                      <td className="p-3 font-semibold text-[#d0d6e5]">{log.device_type}</td>
                      <td className="p-3"><span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white">{log.referrer?.startsWith("Direct") ? "Direct" : (log.referrer || "Direct")}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
