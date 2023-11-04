import { Webhook } from "@prisma/client";

export const sendResponse = async (webhook: Webhook, viewer: any) => {
  webhook.events.forEach(async (hook) => {
    if (hook === "Link.Viewed") {
      await fetch(webhook.target, {
        method: "POST",
        body: JSON.stringify({
          viewer,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  });
};
