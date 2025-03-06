import { NextResponse } from "next/server";

import { receiver } from "@/lib/cron";
import { log } from "@/lib/utils";
import { processEmailQueue } from "@/lib/year-in-review/send-emails";

// Runs every hour (0 * * * *)
export const maxDuration = 300; // 5 minutes in seconds

export async function POST(req: Request) {
  const body = await req.json();
  if (process.env.VERCEL === "1") {
    const isValid = await receiver.verify({
      signature: req.headers.get("Upstash-Signature") || "",
      body: JSON.stringify(body),
    });
    if (!isValid) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    await processEmailQueue();
    return NextResponse.json({ success: true });
  } catch (error) {
    await log({
      message: `Year in review email cron failed. \n\nError: ${(error as Error).message}`,
      type: "cron",
      mention: true,
    });
    return NextResponse.json({ error: (error as Error).message });
  }
}
