import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { getViewPageDuration } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    // GET /api/teams/:teamId/documents/:id/export-visits
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  // get document id and teamId from query params
  const { teamId, id: docId } = req.query as { teamId: string; id: string };

  const userId = (session.user as CustomUser).id;

  try {
    // Fetching Team based on team.id
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

    if (team.plan.includes("free")) {
      return res
        .status(403)
        .json({ message: "This feature is not available for your plan" });
    }

    // Fetching Document based on document.id
    const document = await prisma.document.findUnique({
      where: { id: docId, teamId: teamId },
      select: {
        id: true,
        name: true,
        numPages: true,
        versions: {
          orderBy: { createdAt: "desc" },
          select: {
            versionNumber: true,
            createdAt: true,
            numPages: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).end("Document not found");
    }

    // Fetch views data from the database
    const views = await prisma.view.findMany({
      where: { documentId: docId },
      include: {
        link: { select: { name: true } },
        agreementResponse: true,
      },
    });

    if (!views || views.length === 0) {
      return res.status(404).end("Document has no views");
    }

    // Fetching durations from tinyBird function
    const durationsPromises = views?.map((view) =>
      getViewPageDuration({
        documentId: docId,
        viewId: view.id,
        since: 0,
      }),
    );

    const durations = await Promise.all(durationsPromises);

    const exportData = views?.map((view: any, index: number) => {
      // Identifying the document version as per the time we Viewed it.
      const relevantDocumentVersion = document.versions.find(
        (version) => version.createdAt <= view.viewedAt,
      );

      const numPages =
        relevantDocumentVersion?.numPages || document.numPages || 0;

      // Calculating the completion rate in percentage.
      const completionRate = numPages
        ? (durations[index].data.length / numPages) * 100
        : 0;

      return {
        viewedAt: view.viewedAt.toISOString(),
        viewerName: view.viewerName || "NaN", // If the value is not available we are showing NaN as per csv
        viewerEmail: view.viewerEmail || "NaN",
        linkName: view.link?.name || "NaN",
        totalVisitDuration: durations[index].data.reduce(
          (total, data) => total + data.sum_duration,
          0,
        ),
        visitCompletion: completionRate.toFixed(2) + "%",
        documentVersion:
          relevantDocumentVersion?.versionNumber ||
          document.versions[0]?.versionNumber ||
          "NaN",
        downloadedAt: view.downloadedAt
          ? view.downloadedAt.toISOString()
          : "NaN",
        verified: view.verified ? "Yes" : "No",
        agreement: view.agreementResponse ? "Yes" : "NaN",
        dataroom: view.dataroomId ? "Yes" : "No",
      };
    });

    return res.status(200).json({
      documentName: document.name,
      visits: exportData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
