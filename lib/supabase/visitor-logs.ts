import { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * Automatically purges visitor logs older than retentionDays (default: 30 days).
 * Prevents database storage bloat on Supabase.
 * Returns the count of deleted logs.
 */
export async function purgeOldVisitorLogs(
  retentionDays = 30,
  client?: SupabaseClient
): Promise<number> {
  try {
    const days = Math.max(1, Math.floor(retentionDays));
    const supabase = client || (process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : await createClient());

    // 1. Try DB RPC if available
    try {
      const { data: rpcCount, error: rpcError } = await supabase.rpc("purge_old_visitor_logs", {
        retention_days: days,
      });
      if (!rpcError && typeof rpcCount === "number") {
        return rpcCount;
      }
    } catch {
      // Fallback to direct query
    }

    // 2. Direct query fallback
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("visitor_logs")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate);

    if (error) {
      console.warn("[VisitorLogs] Retention purge error:", error.message);
      return 0;
    }

    if (typeof count === "number" && count > 0) {
      console.log(`[VisitorLogs] Pruned ${count} logs older than ${days} days.`);
    }

    return count || 0;
  } catch (err) {
    console.error("[VisitorLogs] Failed to purge old visitor logs:", err);
    return 0;
  }
}
