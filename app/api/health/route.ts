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
        status: "ok",
        service: "rakexura-store",
        timestamp,
        env,
        latencyMs: Date.now() - start,
      },
      { status: 200 }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    // Log error internally
    console.error("Health check failure:", errorMsg);

    return NextResponse.json(
      {
        status: "error",
        service: "rakexura-store",
        timestamp,
        env,
        error: "Service unavailable",
      },
      { status: 503 }
    );
  }
}
