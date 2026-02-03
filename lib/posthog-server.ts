import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

/**
 * Get or create a PostHog server-side client instance.
 * Returns null if PostHog is not configured.
 */
export function getPostHogServerClient(): PostHog | null {
  const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!postHogKey) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(postHogKey, {
      host: "https://eu.i.posthog.com",
      // Flush events immediately in serverless environments
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

/**
 * Capture an event in PostHog from the server-side.
 * Safe to call even if PostHog is not configured.
 */
export async function capturePostHogEvent({
  distinctId,
  event,
  properties,
}: {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  const client = getPostHogServerClient();

  if (!client) {
    return;
  }

  client.capture({
    distinctId,
    event,
    properties,
  });

  // Flush immediately to ensure event is sent before response
  await client.flush();
}
