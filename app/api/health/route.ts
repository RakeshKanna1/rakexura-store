import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV || "development";

  try {
    const supabase = await createClient();
    
    // Lightweight database check
    const dbCheck = async () => {
      const { error } = await supabase
        .from("games")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return true;
    };

    // Timeout of 3 seconds for DB check
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database check timeout")), 3000)
    );

    await Promise.race([dbCheck(), timeout]);

    return NextResponse.json(
      {
        success: true,
        data: {
          status: "ok",
          database: "connected",
          service: "rakexura-store",
          timestamp,
          env,
          latencyMs: Date.now() - start,
        }
      },
      { status: 200 }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Health check failure:", errorMsg);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Service unavailable",
          code: "HEALTH_CHECK_FAILED"
        },
        data: {
          status: "error",
          database: "disconnected",
          service: "rakexura-store",
          timestamp,
          env,
        }
      },
      { status: 503 }
    );
  }
}
