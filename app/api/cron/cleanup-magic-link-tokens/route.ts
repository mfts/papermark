import { NextResponse } from "next/server";

import { receiver } from "@/lib/cron";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

/**
 * Cron job to clean up expired magic link tokens.
 * Runs daily to remove tokens that have passed their expiration date.
 * This complements the lazy cleanup that happens when tokens are accessed.
 */

export const maxDuration = 60; // 1 minute should be plenty

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
    // Delete all expired magic link tokens
    const result = await prisma.magicLinkToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    console.log(
      `[Cleanup] Deleted ${result.count} expired magic link tokens`,
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    await log({
      message: `Magic link token cleanup cron failed. \n\nError: ${(error as Error).message}`,
      type: "cron",
    });
    return NextResponse.json({ error: (error as Error).message });
  }
}
