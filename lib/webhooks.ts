import prisma from "@/lib/prisma";
import { Event } from "@prisma/client";

interface IWebhookTrigger {
  eventType: Event;
  eventData: any;
}

export async function triggerWebhooks({
  eventType,
  eventData,
}: IWebhookTrigger) {
  try {
    const userId = eventData.userId;
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
      },
    });

    for (let webhook of webhooks) {
      if (webhook.events.includes(eventType)) {
        // send the post request to the webhook's target url
        await sendToWebhookEndpoint(webhook.targetUrl, eventData);
      }
    }

    const internalNotificationWebhook = "/api/webhooks";
    await sendToWebhookEndpoint(internalNotificationWebhook, eventData);
  } catch (error) {
    console.log(error as Error);
  }
}

async function sendToWebhookEndpoint(url: string, data: any) {
  await fetch(url, {
    method: "POST",
    body: data,
  });
}
