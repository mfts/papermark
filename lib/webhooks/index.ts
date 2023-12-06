import crypto from "crypto";
import prisma from "@/lib/prisma";
import { IWebhookTrigger } from "./types";

export async function triggerWebhooks({
  eventType,
  eventData,
}: IWebhookTrigger) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        teamId: eventData.teamId,
        events: {
          has: eventType,
        },
      },
      select: {
        targetUrl: true,
      },
    });

    for (let webhook of webhooks) {
      // send the post request to the webhook's target url
      await sendToWebhookEndpoint(webhook.targetUrl, {
        eventType,
        eventData,
      });
    }

    // send data to internal webhook endpoint for notifications
    const internalNotificationWebhook = `${process.env.NEXT_PUBLIC_BASE_URL}/api/teams/${eventData.teamId}/notifications/webhooks`;
    await sendToWebhookEndpoint(internalNotificationWebhook, {
      eventType,
      eventData,
    });
  } catch (error) {
    console.log(error as Error);
  }
}

async function sendToWebhookEndpoint(url: string, data: any) {
  const signature = generateSignature(JSON.stringify(data));
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-signature": signature,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res;
}

const SECRET_KEY = process.env.WEBHOOK_SECRET_KEY as string;

export function generateSignature(data: string) {
  return crypto.createHmac("sha256", SECRET_KEY).update(data).digest("hex");
}

export function verifySignature(body: string, signature: string) {
  if (!body || !signature) {
    return false;
  }

  const hash = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}
