import { emptyAnalytics, jitsuAnalytics } from "@jitsu/js";
import { AnalyticsEvents } from "../types";
import prisma from "@/lib/prisma";

export const analytics =
  process.env.JITSU_HOST && process.env.JITSU_WRITE_KEY
    ? jitsuAnalytics({
        host: process.env.JITSU_HOST,
        writeKey: process.env.JITSU_WRITE_KEY,
      })
    : emptyAnalytics;

const fetchUserWithCounts = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      _count: {
        select: {
          documents: true,
          domains: true,
        },
      },
      documents: {
        select: {
          _count: {
            select: {
              links: true,
              views: true,
            },
          },
        },
      },
    },
  });
};

const getUserProperties = (user: any) => {
  let linkCount = user.documents.reduce(
    (acc: any, document: { _count: { links: number; views: number } }) =>
      acc + document._count.links,
    0,
  );

  let viewCount = user.documents.reduce(
    (acc: any, document: { _count: { links: number; views: number } }) =>
      acc + document._count.views,
    0,
  );

  const userData = {
    userId: user.id,
    email: user.email,
    documentCount: user._count.documents,
    domainCount: user._count.domains,
    linkCount: linkCount,
    viewCount: viewCount,
  };

  return userData;
};

export const identifyUser = async (userId: string) => {
  const user = await fetchUserWithCounts(userId);
  const userProperties = getUserProperties(user);
  analytics.identify(userId, userProperties);
};

export const trackAnalytics = (args: AnalyticsEvents) => analytics.track(args);
