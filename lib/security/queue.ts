import { after } from "next/server";

/**
 * Executes a long-running operation in the background after the response is sent.
 * Uses Next.js 15 native after() callback if available.
 */
export function runBackgroundJob(job: () => Promise<unknown>) {
  try {
    after(async () => {
      await job();
    });
  } catch {
    // Fallback fire-and-forget for environments where after() is not supported/enabled
    job().catch((err) => {
      console.error("Structured Background Job Execution Failed:", err);
    });
  }
}
