import { TriggerClient } from "@trigger.dev/sdk";

export const client = new TriggerClient({
  id: "papermark-dev-Ojwu",
  apiKey: process.env.TRIGGER_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
});

export function getTriggerClient(): TriggerClient | null {
  const triggerKey = process.env.TRIGGER_API_KEY;
  const triggerUrl = process.env.TRIGGER_API_URL;

  if (!triggerKey || !triggerUrl) {
    return null;
  }

  const client = new TriggerClient({
    id: "papermark-dev-Ojwu",
    apiKey: process.env.TRIGGER_API_KEY,
    apiUrl: process.env.TRIGGER_API_URL,
  });

  return client;
}
