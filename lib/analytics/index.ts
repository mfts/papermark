import { emptyAnalytics, jitsuAnalytics } from "@jitsu/js";
import { AnalyticsEvents } from "@/lib/types";
import prisma from "@/lib/prisma";
import { getPostHogConfig, getPostHogServerClient } from "@/lib/posthog";
import { posthog } from "posthog-js";
import { log } from "../utils";

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

export function getAnalyticsServer() {
  const postHogClient = getPostHogServerClient();

  const capture = async (
    distinctId: string, // email or user id
    event: string,
    properties?: Record<string, unknown>,
  ) => {
    if (!postHogClient) {
      log({
        message: `Posthog client not enabled for server event: *${event}*`,
        type: "error",
      });
      return;
    }

    try {
      postHogClient.capture({ distinctId, event, properties });
      await postHogClient.shutdownAsync();
    } catch (e) {
      log({
        message: `Failed to record posthog for event: *${event}*`,
        type: "error",
      });
    }
  };

  return {
    capture,
  };
}

// DEPRECATED
// export const analytics =
//   process.env.JITSU_HOST && process.env.JITSU_WRITE_KEY
//     ? jitsuAnalytics({
//         host: process.env.JITSU_HOST,
//         writeKey: process.env.JITSU_WRITE_KEY,
//       })
//     : emptyAnalytics;

// const fetchUserWithCounts = async (userId: string) => {
//   return await prisma.user.findUnique({
//     where: { id: userId },
//     select: {
//       id: true,
//       email: true,
//       _count: {
//         select: {
//           documents: true,
//           domains: true,
//         },
//       },
//       documents: {
//         select: {
//           _count: {
//             select: {
//               links: true,
//               views: true,
//             },
//           },
//         },
//       },
//     },
//   });
// };

// const getUserProperties = (user: any) => {
//   let linkCount = user.documents.reduce(
//     (acc: any, document: { _count: { links: number; views: number } }) =>
//       acc + document._count.links,
//     0,
//   );

//   let viewCount = user.documents.reduce(
//     (acc: any, document: { _count: { links: number; views: number } }) =>
//       acc + document._count.views,
//     0,
//   );

//   const userData = {
//     userId: user.id,
//     email: user.email,
//     documentCount: user._count.documents,
//     domainCount: user._count.domains,
//     linkCount: linkCount,
//     viewCount: viewCount,
//   };

//   return userData;
// };

// export const identifyUser = async (userId: string) => {
//   const user = await fetchUserWithCounts(userId);
//   const userProperties = getUserProperties(user);
//   analytics.identify(userId, userProperties);
// };

// export const trackAnalytics = (args: AnalyticsEvents) => analytics.track(args);
