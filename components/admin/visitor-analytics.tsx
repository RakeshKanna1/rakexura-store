"use client";

import { useEffect, useState } from "react";
import { Users, Eye, Smartphone, Monitor, Globe, Compass, RefreshCw, ArrowUpRight, Activity } from "lucide-react";
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

export function VisitorAnalytics() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  async function fetchLogs() {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Fetch recent 100 visitor logs
      const { data, error } = await supabase
        .from("visitor_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        setLogs(data as VisitorLog[]);
      }

      // Calculate live active visitors in last 5 minutes
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
    const interval = setInterval(fetchLogs, 15000); // Auto refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Compute stats
  const totalPageviews = logs.length;
  const uniqueVisitors = new Set(logs.map((l) => l.visitor_id)).size;
  const mobileCount = logs.filter((l) => l.device_type === "Mobile" || l.device_type === "Tablet").length;
  const desktopCount = logs.filter((l) => l.device_type === "Desktop").length;
  const mobilePercent = totalPageviews > 0 ? Math.round((mobileCount / totalPageviews) * 100) : 0;
  const desktopPercent = 100 - mobilePercent;

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
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Recent Stream</span>
          </div>
          <strong className="block text-2xl font-black text-white">{totalPageviews}</strong>
          <span className="mt-1 block text-xs text-[#8991a6]">Total Recent Pageviews</span>
        </div>

        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-5">
          <div className="flex items-center justify-between text-[#facc15] mb-3">
            <Users size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8991a6]">Unique</span>
          </div>
          <strong className="block text-2xl font-black text-white">{uniqueVisitors}</strong>
          <span className="mt-1 block text-xs text-[#8991a6]">Unique Visitors</span>
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
        {/* Top Visited Pages */}
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
            {topPages.length === 0 && (
              <div className="py-6 text-center text-xs text-[#8991a6]">No pageview data recorded yet</div>
            )}
          </div>
        </div>

        {/* Top Traffic Sources */}
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
            {topReferrers.length === 0 && (
              <div className="py-6 text-center text-xs text-[#8991a6]">No referral source data recorded yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Live Visitor Feed Stream Table */}
      <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0924]/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Visitor Activity Stream</h3>
            <p className="text-xs text-[#8991a6]">Real-time stream of page visits with device, referral, and customer profiles.</p>
          </div>
          <span className="text-xs text-[#8991a6]">Showing last {logs.length} events</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[#8991a6]">
                <th className="p-3">Time</th>
                <th className="p-3">Visitor / Customer</th>
                <th className="p-3">Page Visited</th>
                <th className="p-3">Device</th>
                <th className="p-3">Traffic Source</th>
                <th className="p-3">IP Address</th>
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
                      <span className="font-bold text-[#70efbb] flex items-center gap-1">
                        👤 {log.user_name}
                      </span>
                    ) : (
                      <span className="font-mono text-[#8991a6]">Guest ({log.visitor_id.substring(0, 10)})</span>
                    )}
                  </td>
                  <td className="p-3">
                    <a
                      href={log.path}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-white hover:text-[#8b5cf6] underline flex items-center gap-1"
                    >
                      {log.path} <ArrowUpRight size={12} />
                    </a>
                  </td>
                  <td className="p-3 font-semibold text-[#d0d6e5]">
                    {log.device_type === "Mobile" ? "📱 Mobile" : log.device_type === "Tablet" ? "平板 Tablet" : "💻 Desktop"}
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {log.referrer || "Direct"}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[#656d82]">
                    {log.ip_address || "Unknown"}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8991a6]">
                    No visitor logs recorded yet. Visit any game page to start capturing traffic!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
