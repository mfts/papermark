import { NextApiRequest, NextApiResponse } from "next";

import { View } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import {
  getTotalAvgPageDuration,
  getTotalDocumentDuration,
} from "@/lib/tinybird";

import { authOptions } from "../../../../auth/[...nextauth]";

function parseCsvParam(param?: string): string[] {
  return param?.split(",").map(s => s.trim()).filter(Boolean) || [];
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const {
    teamId,
    id: docId,
    excludeTeamMembers,
    includeLinks,
    filterByViewer,
    excludeLinks,
    excludeViewers,
  } = req.query as {
    teamId: string;
    id: string;
    excludeTeamMembers?: string;
      includeLinks?: string;
      filterByViewer?: string;
      excludeLinks?: string;
      excludeViewers?: string;
    };


  console.time(`Document stats for ${docId}`);

  try {
    const [document, teamMemberEmails] = await Promise.all([
      prisma.document.findUnique({
        where: { id: docId, teamId },
        include: {
          views: true,
          team: { select: { plan: true } },
        },
      }),
      prisma.user.findMany({
        where: { teams: { some: { teamId: teamId } } },
        select: { email: true },
      }).then(users => new Set(users.map(u => u.email as string))),
    ]);

    const views = document?.views;

    if (!views || views.length === 0) {
      return res.status(200).json({
        views: [],
        duration: { data: [] },
        total_duration: 0,
        groupedReactions: [],
        totalViews: 0,
      });
    }

    let filteredViews = views.filter((view) => !view.isArchived);

    const includedLinkIdsSet = new Set(parseCsvParam(includeLinks));
    const excludedLinkIdsSet = new Set(parseCsvParam(excludeLinks));
    const excludedViewerEmailsSet = new Set(parseCsvParam(excludeViewers));

    if (includedLinkIdsSet.size > 0) {
      filteredViews = filteredViews.filter((view) =>
        includedLinkIdsSet.has(view.linkId)
      );
    }

    if (filterByViewer) {
      const lowerFilterViewer = filterByViewer.toLowerCase();
      filteredViews = filteredViews.filter((view) =>
        view.viewerEmail?.toLowerCase().includes(lowerFilterViewer)
      );
    }

    if (excludedLinkIdsSet.size > 0) {
      filteredViews = filteredViews.filter((view) =>
        !excludedLinkIdsSet.has(view.linkId)
      );
    }

    if (excludedViewerEmailsSet.size > 0) {
      filteredViews = filteredViews.filter((view) =>
        !view.viewerEmail || !excludedViewerEmailsSet.has(view.viewerEmail)
      );
    }

    let internalViews: View[] = [];
    if (excludeTeamMembers) {
      internalViews = filteredViews.filter((view) =>
        teamMemberEmails.has(view.viewerEmail as string)
      );
      const internalViewIds = new Set(internalViews.map(v => v.id));
      filteredViews = filteredViews.filter((view) =>
        !internalViewIds.has(view.id)
      );
    }

    const filteredViewIds = new Set(filteredViews.map(v => v.id));
    const allExcludedViews = views.filter(v => !filteredViewIds.has(v.id));

    const allLinkIds = new Set(views.map(v => v.linkId));
    let tinybirdExcludedLinkIds: string[] = [...excludedLinkIdsSet];
    if (includedLinkIdsSet.size > 0) {
      const additionalExclusions = [...allLinkIds].filter(id => !includedLinkIdsSet.has(id));
      tinybirdExcludedLinkIds.push(...additionalExclusions);
    }

    const [groupedReactions, duration, totalDocumentDuration] = await Promise.all([
      prisma.reaction.groupBy({
        by: ["type"],
        where: {
          viewId: { in: filteredViews.map((view) => view.id) },
        },
        _count: { type: true },
      }),
      getTotalAvgPageDuration({
        documentId: docId,
        excludedLinkIds: tinybirdExcludedLinkIds.join(","),
        excludedViewIds: allExcludedViews.map((view) => view.id).join(","),
        since: 0,
      }),
      getTotalDocumentDuration({
        documentId: docId,
        excludedLinkIds: tinybirdExcludedLinkIds.join(","),
        excludedViewIds: allExcludedViews.map((view) => view.id).join(","),
        since: 0,
      })
    ]);

    const totalDuration = totalDocumentDuration.data[0]?.sum_duration || 0;

    const stats = {
      views: filteredViews,
      duration,
      total_duration: filteredViews.length > 0
        ? (totalDuration * 1.0) / filteredViews.length
        : 0,
      groupedReactions,
      totalViews: filteredViews.length,
    };

    console.timeEnd(`Document stats for ${docId}`);
    return res.status(200).json(stats);
  } catch (error) {
    console.timeEnd(`Document stats for ${docId}`);
    errorhandler(error, res);
  }
}
