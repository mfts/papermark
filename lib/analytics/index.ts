import { emptyAnalytics, jitsuAnalytics } from "@jitsu/js";
import { posthog } from "posthog-js";

import { getPostHogConfig } from "@/lib/posthog";
import { AnalyticsEvents } from "@/lib/types";

export function useAnalytics() {
  const isPostHogEnabled = getPostHogConfig();

  /**
   * Capture an analytic event with team context.
   *
   * @param event The event name.
   * @param properties Properties to attach to the event.
   * @param teamId Optional team ID to associate the event with the team group.
   */
  const capture = (event: string, properties?: Record<string, unknown>, teamId?: string) => {
    if (!isPostHogEnabled) {
      return;
    }

    // Get current team from localStorage if not provided
    const currentTeamId = teamId || (typeof window !== "undefined" ? localStorage.getItem("currentTeamId") : null);
    
    const eventProperties = {
      ...properties,
      ...(currentTeamId && { $groups: { team: currentTeamId } }),
    };

    posthog.capture(event, eventProperties);
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

  /**
   * Associate user with a team group.
   *
   * @param teamId Team ID to associate with.
   * @param teamProperties Properties of the team.
   */
  const groupIdentify = (teamId: string, teamProperties: Record<string, unknown>) => {
    if (!isPostHogEnabled) {
      return;
    }

    posthog.group("team", teamId, teamProperties);
  };

  return {
    capture,
    identify,
    groupIdentify,
  };
}

// For server-side tracking
const analytics =
  process.env.JITSU_HOST && process.env.JITSU_WRITE_KEY
    ? jitsuAnalytics({
        host: process.env.JITSU_HOST,
        writeKey: process.env.JITSU_WRITE_KEY,
      })
    : emptyAnalytics;

export const identifyUser = (userId: string, teamId?: string, teamName?: string) => {
  analytics.identify(userId, {
    ...(teamId && { team_id: teamId }),
    ...(teamName && { team_name: teamName }),
  });
};

export const trackAnalytics = (args: AnalyticsEvents & { teamId?: string; teamName?: string }) => {
  const { teamId, teamName, ...eventArgs } = args;
  
  // Add team context to all server-side events
  const eventWithTeamContext = {
    ...eventArgs,
    ...(teamId && { team_id: teamId }),
    ...(teamName && { team_name: teamName }),
  };
  
  analytics.track(eventWithTeamContext);

  // Also track as PostHog group event if we have team info
  if (teamId && typeof window !== "undefined") {
    const posthogConfig = getPostHogConfig();
    if (posthogConfig) {
      // Import posthog dynamically to avoid SSR issues
      import("posthog-js").then((module) => {
        const posthog = module.default;
        if (posthog && posthog.isFeatureEnabled) {
          posthog.capture(eventArgs.event, {
            ...eventArgs,
            $groups: { team: teamId },
          });
        }
      });
    }
  }
};
