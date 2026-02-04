import { emptyAnalytics, jitsuAnalytics } from "@jitsu/js";
import { PostHog } from "posthog-node";
import { posthog } from "posthog-js";

import { getPostHogConfig } from "@/lib/posthog";
import { AnalyticsEvents } from "@/lib/types";

// =============================================================================
// Client-side Analytics (PostHog via posthog-js)
// =============================================================================

export function useAnalytics() {
  const isPostHogEnabled = getPostHogConfig();

  /**
   * Capture an analytic event.
   *
   * @param event The event name.
   * @param properties Properties to attach to the event.
   */
  const capture = (event: string, properties?: Record<string, unknown>) => {
    if (!isPostHogEnabled) {
      return;
    }

    posthog.capture(event, properties);
  };

  const identify = (
    distinctId?: string,
    properties?: Record<string, unknown>,
  ) => {
    if (!isPostHogEnabled) {
      return;
    }

    posthog.identify(distinctId, properties);
  };

  return {
    capture,
    identify,
  };
}

// =============================================================================
// Server-side Analytics (Jitsu)
// =============================================================================

const jitsu =
  process.env.JITSU_HOST && process.env.JITSU_WRITE_KEY
    ? jitsuAnalytics({
        host: process.env.JITSU_HOST,
        writeKey: process.env.JITSU_WRITE_KEY,
      })
    : emptyAnalytics;

export const identifyUser = (userId: string) => jitsu.identify(userId);
export const trackAnalytics = (args: AnalyticsEvents) => jitsu.track(args);

// =============================================================================
// Server-side Analytics (PostHog via posthog-node)
// =============================================================================

let posthogServerClient: PostHog | null = null;

function getPostHogServerClient(): PostHog | null {
  const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!postHogKey) {
    return null;
  }

  if (!posthogServerClient) {
    posthogServerClient = new PostHog(postHogKey, {
      host: "https://eu.i.posthog.com",
      // Flush events immediately in serverless environments
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogServerClient;
}

/**
 * Server-side analytics helper for PostHog.
 * Similar pattern to the client-side useAnalytics hook.
 */
export const analytics = {
  /**
   * Capture an analytic event server-side.
   *
   * @param distinctId The user's unique identifier (typically email or userId).
   * @param event The event name.
   * @param properties Properties to attach to the event.
   */
  capture: async ({
    distinctId,
    event,
    properties,
  }: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }): Promise<void> => {
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
  },

  /**
   * Identify a user server-side.
   *
   * @param distinctId The user's unique identifier (typically email or userId).
   * @param properties User properties to set.
   */
  identify: async ({
    distinctId,
    properties,
  }: {
    distinctId: string;
    properties?: Record<string, unknown>;
  }): Promise<void> => {
    const client = getPostHogServerClient();

    if (!client) {
      return;
    }

    client.identify({
      distinctId,
      properties,
    });

    await client.flush();
  },
};
