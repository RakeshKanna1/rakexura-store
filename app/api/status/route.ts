import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        service: "rakexura-store",
        version: "1.0.0",
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA || "local-dev",
        region: process.env.VERCEL_REGION || "local",
        timestamp: new Date().toISOString(),
      }
    },
    { status: 200 }
  );
}
