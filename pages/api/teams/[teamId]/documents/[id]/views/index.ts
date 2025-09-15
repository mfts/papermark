import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { View } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";
import { getServerSession } from "next-auth/next";

import { LIMITS } from "@/lib/constants";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getViewPageDuration } from "@/lib/tinybird";
import { getVideoEventsByDocument } from "@/lib/tinybird/pipes";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

type DocumentVersion = {
  versionNumber: number;
  createdAt: Date;
  numPages: number | null;
  type: string | null;
  length: number | null;
};

type Document = {
  id: string;
  versions: DocumentVersion[];
  numPages: number | null;
  type: string | null;
  ownerId: string | null;
  _count: {
    views: number;
  };
};

type VideoEvent = {
  view_id: string;
  start_time: number;
  end_time: number;
  event_type: string;
};

type ViewWithExtras = View & {
  link: { name: string | null };
  feedbackResponse: {
    id: string;
    data: JsonValue;
  } | null;
  agreementResponse: {
    id: string;
    agreementId: string;
    agreement: { name: string };
  } | null;
};

async function getVideoViews(
  views: ViewWithExtras[],
  document: Document,
  videoEvents: { data: VideoEvent[] },
) {
  const durationsPromises = views.map((view) => {
    const viewEvents =
      videoEvents?.data.filter(
        (event) =>
          event.view_id === view.id &&
          ["played", "muted", "unmuted", "rate_changed"].includes(
            event.event_type,
          ) &&
          event.end_time > event.start_time &&
          event.end_time - event.start_time >= 1,
      ) || [];

    // Track timestamps and their frequency for total watch time
    const timestampCounts = new Map<number, number>();
    // Track unique timestamps for completion calculation
    const uniqueTimestamps = new Set<number>();

    // Calculate total watch time
    // let totalWatchTime = 0;
    viewEvents.forEach((event) => {
      for (let t = event.start_time; t < event.end_time; t++) {
        const timestamp = Math.floor(t);
        // Count total occurrences including replays
        timestampCounts.set(
          timestamp,
          (timestampCounts.get(timestamp) || 0) + 1,
        );
        // Track unique timestamps
        uniqueTimestamps.add(timestamp);
      }
    });

    // Sum up all timestamps including duplicates for total watch time
    let totalWatchTime = 0;
    timestampCounts.forEach((count) => {
      totalWatchTime += count;
    });

    // Get the number of unique timestamps watched
    const uniqueWatchTime = uniqueTimestamps.size;

    return {
      data: [],
      totalWatchTime,
      uniqueWatchTime,
      videoLength: document.versions[0]?.length || 0,
    };
  });

  const durations = await Promise.all(durationsPromises);

  return views.map((view, index) => {
    const relevantDocumentVersion = document.versions.find(
      (version) => version.createdAt <= view.viewedAt,
    );

    const duration = durations[index];
    const completionRate =
      duration.videoLength > 0
        ? Math.min(100, (duration.uniqueWatchTime / duration.videoLength) * 100)
        : 0;

    return {
      ...view,
      duration: durations[index],
      totalDuration: duration.totalWatchTime * 1000, // convert to milliseconds
      completionRate: completionRate.toFixed(),
      versionNumber: relevantDocumentVersion?.versionNumber || 1,
      versionNumPages: 0,
    };
  });
}

async function getDocumentViews(views: ViewWithExtras[], document: Document) {
  const durationsPromises = views.map((view) => {
    return getViewPageDuration({
      documentId: document.id,
      viewId: view.id,
      since: 0,
    });
  });

  const durations = await Promise.all(durationsPromises);

  return views.map((view, index) => {
    const relevantDocumentVersion = document.versions.find(
      (version) => version.createdAt <= view.viewedAt,
    );

    const numPages =
      relevantDocumentVersion?.numPages || document.numPages || 0;
    const completionRate = numPages
      ? (durations[index].data.length / numPages) * 100
      : 0;

    return {
      ...view,
      duration: durations[index],
      totalDuration: durations[index].data.reduce(
        (total: number, data: { sum_duration: number }) =>
          total + data.sum_duration,
        0,
      ),
      completionRate: completionRate.toFixed(),
      versionNumber: relevantDocumentVersion?.versionNumber || 1,
      versionNumPages: numPages,
    };
  });
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: docId } = req.query as { teamId: string; id: string };
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const offset = (page - 1) * limit;

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
        select: { plan: true },
      });

      if (!team) {
        return res.status(404).end("Team not found");
      }

      const document = await prisma.document.findUnique({
        where: { id: docId, teamId: teamId },
        select: {
          id: true,
          ownerId: true,
          numPages: true,
          type: true,
          versions: {
            orderBy: { createdAt: "desc" },
            select: {
              versionNumber: true,
              createdAt: true,
              numPages: true,
              type: true,
              length: true,
            },
          },
          _count: {
            select: {
              views: true,
            },
          },
        },
      });

      if (!document) {
        return res.status(404).end("Document not found");
      }

      // Check if document has any views first to avoid expensive query
      const viewCount = await prisma.view.count({
        where: {
          documentId: docId,
          isArchived: false,
        },
      });

      if (viewCount === 0) {
        return res.status(200).json({
          viewsWithDuration: [],
          hiddenViewCount: 0,
          totalViews: 0,
        });
      }

      const views = await prisma.view.findMany({
        skip: offset,
        take: limit,
        where: {
          documentId: docId,
        },
        orderBy: {
          viewedAt: "desc",
        },
        include: {
          link: {
            select: {
              name: true,
            },
          },
          feedbackResponse: {
            select: {
              id: true,
              data: true,
            },
          },
          agreementResponse: {
            select: {
              id: true,
              agreementId: true,
              agreement: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!views) {
        return res.status(404).end("Document has no views");
      }

      const users = await prisma.user.findMany({
        where: {
          teams: {
            some: {
              teamId: teamId,
            },
          },
        },
        select: {
          email: true,
        },
      });

      // filter the last 20 views
      const limitedViews =
        team.plan === "free" && offset >= LIMITS.views ? [] : views;

      let viewsWithDuration;
      if (document.type === "video") {
        const videoEvents = await getVideoEventsByDocument({
          document_id: docId,
        });
        viewsWithDuration = await getVideoViews(
          limitedViews,
          document,
          videoEvents,
        );
      } else {
        viewsWithDuration = await getDocumentViews(limitedViews, document);
      }

      // Add internal flag to all views
      viewsWithDuration = viewsWithDuration.map((view) => ({
        ...view,
        internal: users.some((user) => user.email === view.viewerEmail),
      }));

      return res.status(200).json({
        viewsWithDuration,
        hiddenViewCount: views.length - limitedViews.length,
        totalViews: document._count.views || 0,
      });
    } catch (error) {
      log({
        message: `Failed to get views for document: _${docId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
