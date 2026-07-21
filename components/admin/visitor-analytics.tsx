"use client";

import { useEffect, useState } from "react";
import { Users, Eye, Smartphone, Monitor, Globe, Compass, RefreshCw, ArrowUpRight, Activity, ChevronDown, ChevronUp, Layers, ListFilter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

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
        const uniqueActive = new Set(activeData.map((item) => item.visitor_id));
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
    const src = l.referrer || "Direct / None";
    refMap[src] = (refMap[src] || 0) + 1;
  });
  const topReferrers = Object.entries(refMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-gradient-to-r from-[#0d0924] via-[#120e2e] to-[#0d0924] p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-[#00d68f]/30 bg-[#00d68f]/10 text-[#00d68f]">
            <Activity size={24} />
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">Live Visitor Monitor</h2>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-black text-emerald-400">
                REAL-TIME
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8991a6]">
              Tracking anonymous visitors and logged-in customer activity across Rakexura.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live Active Online</span>
            <strong className="text-xl font-black text-white">{activeCount} Visitor{activeCount !== 1 ? "s" : ""}</strong>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-white transition hover:bg-white/10"
            title="Refresh analytics"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-[#8b5cf6]" : ""} />
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-5">
          <div className="flex items-center justify-between text-[#8b5cf6] mb-3">
            <Eye size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Total Views</span>
          </div>
          <strong className="block text-2xl font-black text-white">{totalPageviews}</strong>
          <span className="mt-1 block text-xs text-[#8991a6]">Recent Page Views</span>
        </div>

        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-5">
          <div className="flex items-center justify-between text-[#facc15] mb-3">
            <Users size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Unique Users</span>
          </div>
          <strong className="block text-2xl font-black text-white">{uniqueVisitors}</strong>
          <span className="mt-1 block text-xs text-[#8991a6]">Active Visitor Sessions</span>
        </div>

        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-5">
          <div className="flex items-center justify-between text-[#20c763] mb-3">
            <Smartphone size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Mobile Share</span>
          </div>
          <strong className="block text-2xl font-black text-white">{mobilePercent}%</strong>
          <span className="mt-1 block text-xs text-[#8991a6]">Mobile & Tablet Users</span>
        </div>

        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-5">
          <div className="flex items-center justify-between text-[#00d68f] mb-3">
            <Monitor size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Desktop Share</span>
          </div>
          <strong className="block text-2xl font-black text-white">{desktopPercent}%</strong>
          <span className="mt-1 block text-xs text-[#8991a6]">Desktop PC Users</span>
        </div>
      </div>

      {/* Top Pages & Referrers Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Compass size={18} className="text-[#8b5cf6]" />
            <h3 className="text-base font-bold text-white">Most Popular Pages</h3>
          </div>
          <div className="space-y-2.5">
            {topPages.map(([path, count]) => (
              <div key={path} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/30 p-3 text-xs">
                <span className="font-mono text-white truncate max-w-[240px]">{path}</span>
                <span className="rounded bg-[#8b5cf6]/20 px-2 py-0.5 font-bold text-[#b9a4ff]">{count} views</span>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-[#facc15]" />
            <h3 className="text-base font-bold text-white">Traffic Acquisition Sources</h3>
          </div>
          <div className="space-y-2.5">
            {topReferrers.map(([src, count]) => (
              <div key={src} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/30 p-3 text-xs">
                <span className="font-semibold text-white truncate">{src}</span>
                <span className="rounded bg-[#facc15]/20 px-2 py-0.5 font-bold text-[#facc15]">{count} visits</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Visitor Feed Stream */}
      <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Visitor Activity Stream</h3>
            <p className="text-xs text-[#8991a6]">Grouped by customer sessions to avoid duplicate rows when users browse multiple pages.</p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1 text-xs">
            <button
              onClick={() => setViewMode("grouped")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold transition-colors ${
                viewMode === "grouped" ? "bg-[#8b5cf6] text-white" : "text-[#8991a6] hover:text-white"
              }`}
            >
              <Layers size={14} /> Grouped Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold transition-colors ${
                viewMode === "raw" ? "bg-[#8b5cf6] text-white" : "text-[#8991a6] hover:text-white"
              }`}
            >
              <ListFilter size={14} /> All Hits ({logs.length})
            </button>
          </div>
        </div>

        {/* Grouped View */}
        {viewMode === "grouped" ? (
          <div className="space-y-3">
            {sessions.map((sess) => {
              const isExpanded = Boolean(expandedSessions[sess.visitor_id]);
              const latestPage = sess.pages[0];
              return (
                <div key={sess.visitor_id} className="rounded-lg border border-white/10 bg-black/30 overflow-hidden transition-colors">
                  <div
                    onClick={() => toggleExpand(sess.visitor_id)}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#8b5cf6]/10 text-[#b9a4ff] font-bold text-sm">
                        {sess.user_name ? "👤" : "🌐"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className={sess.user_name ? "text-[#70efbb] font-bold" : "text-white font-semibold"}>
                            {sess.user_name || `Guest (${sess.visitor_id.substring(0, 10)})`}
                          </strong>
                          <span className="rounded bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 px-2 py-0.5 text-[10px] font-black text-[#b9a4ff]">
                            {sess.total_hits} page{sess.total_hits > 1 ? "s" : ""} visited
                          </span>
                        </div>
                        <span className="text-xs text-[#8991a6]">
                          Latest page: <code className="text-white font-mono">{latestPage}</code>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#8991a6]">
                      <span className="font-semibold text-white">
                        {sess.device_type === "Mobile" ? "📱 Mobile" : sess.device_type === "Tablet" ? "平板 Tablet" : "💻 Desktop"}
                      </span>
                      <span className="rounded bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white">
                        {sess.referrer || "Direct"}
                      </span>
                      <span className="font-mono">
                        {new Date(sess.latest_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                            className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white hover:border-[#8b5cf6] hover:text-[#b9a4ff]"
                          >
                            <span className="text-[10px] text-[#656d82] font-mono">#{sess.pages.length - idx}</span>
                            {p} <ArrowUpRight size={10} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {sessions.length === 0 && !loading && (
              <div className="py-8 text-center text-xs text-[#8991a6]">No visitor sessions recorded yet</div>
            )}
          </div>
        ) : (
          /* Raw Un-grouped View */
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[#8991a6]">
                  <th className="p-3">Time</th>
                  <th className="p-3">Visitor / Customer</th>
                  <th className="p-3">Page Visited</th>
                  <th className="p-3">Device</th>
                  <th className="p-3">Traffic Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-mono text-[#8991a6] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3">
                      {log.user_name ? (
                        <span className="font-bold text-[#70efbb]">👤 {log.user_name}</span>
                      ) : (
                        <span className="font-mono text-[#8991a6]">Guest ({log.visitor_id.substring(0, 10)})</span>
                      )}
                    </td>
                    <td className="p-3">
                      <a href={log.path} target="_blank" rel="noreferrer" className="font-mono text-white hover:text-[#8b5cf6] underline flex items-center gap-1">
                        {log.path} <ArrowUpRight size={12} />
                      </a>
                    </td>
                    <td className="p-3 font-semibold text-[#d0d6e5]">{log.device_type}</td>
                    <td className="p-3"><span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white">{log.referrer || "Direct"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
