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
    // GET /api/teams/:teamId/datarooms/:id/export-visits
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  // get dataroom id and teamId from query params
  const { teamId, id: dataroomId } = req.query as {
    teamId: string;
    id: string;
  };

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

    // Fetching Dataroom based on dataroom.id
    const dataroom = await prisma.dataroom.findUnique({
      where: { id: dataroomId, teamId: teamId },
      select: {
        id: true,
        name: true,
        documents: {
          select: {
            id: true,
            document: {
              select: {
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
            },
          },
        },
      },
    });

    if (!dataroom) {
      return res.status(404).end("Dataroom not found");
    }

    // First fetch the dataroom views
    const views = await prisma.view.findMany({
      where: {
        dataroomId: dataroomId,
      },
      include: {
        link: { select: { name: true } },
        agreementResponse: {
          include: {
            agreement: {
              select: {
                name: true,
                content: true,
              },
            },
          },
        },
        document: {
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
        },
      },
      orderBy: {
        viewedAt: "desc",
      },
    });

    if (!views || views.length === 0) {
      return res.status(404).end("Dataroom has no views");
    }

    // First get all dataroom views
    const dataroomViews = views.filter(
      (view) => view.viewType === "DATAROOM_VIEW",
    );

    // Get all document views for this dataroom
    const documentViews = views.filter(
      (view) => view.viewType === "DOCUMENT_VIEW",
    );

    // For each dataroom view, get its associated document views and build export data
    const exportData = await Promise.all(
      dataroomViews.map(async (dataroomView) => {
        // Find all document views that belong to this dataroom view
        const associatedDocViews = documentViews.filter(
          (docView) => docView.dataroomViewId === dataroomView.id,
        );

        // Get document view details including durations from Tinybird
        const documentViewDetails = await Promise.all(
          associatedDocViews.map(async (docView) => {
            const duration = await getViewPageDuration({
              documentId: docView.document?.id || "null",
              viewId: docView.id,
              since: 0,
            });

            const relevantVersion = docView.document?.versions.find(
              (version) => version.createdAt <= docView.viewedAt,
            );

            const numPages =
              relevantVersion?.numPages || docView.document?.numPages || 0;
            const completionRate = numPages
              ? (duration.data.length / numPages) * 100
              : 0;

            return {
              documentName: docView.document?.name || "NaN",
              viewedAt: docView.viewedAt.toISOString(),
              downloadedAt: docView.downloadedAt?.toISOString() || "NaN",
              duration: duration.data.reduce(
                (total, data) => total + data.sum_duration,
                0,
              ),
              completionRate: completionRate.toFixed(2) + "%",
              documentVersion:
                relevantVersion?.versionNumber ||
                docView.document?.versions[0]?.versionNumber ||
                "NaN",
            };
          }),
        );

        // Return the complete view data
        return {
          // Dataroom view details
          dataroomViewedAt: dataroomView.viewedAt.toISOString(),
          dataroomDownloadedAt:
            dataroomView.downloadedAt?.toISOString() || "NaN",
          viewerName: dataroomView.viewerName || "NaN",
          viewerEmail: dataroomView.viewerEmail || "NaN",
          linkName: dataroomView.link?.name || "NaN",
          verified: dataroomView.verified ? "Yes" : "NaN",

          // Agreement details
          agreementStatus: dataroomView.agreementResponse ? "Yes" : "NaN",
          agreementName:
            dataroomView.agreementResponse?.agreement.name || "NaN",
          agreementAcceptedAt:
            dataroomView.agreementResponse?.createdAt.toISOString() || "NaN",
          agreementContent:
            dataroomView.agreementResponse?.agreement.content || "NaN",

          // Document view details
          documentViews: documentViewDetails,
        };
      }),
    );

    // Create CSV with nested document views
    const csvRows: string[] = [];

    // Add headers
    csvRows.push(
      [
        "Dataroom Viewed At",
        "Dataroom Downloaded At",
        "Visitor Name",
        "Visitor Email",
        "Link Name",
        "Verified",
        "Agreement Accepted",
        "Agreement Name",
        "Agreement Content",
        "Agreement Accepted At",
        "Document Name",
        "Document Viewed At",
        "Document Downloaded At",
        "Total Visit Duration (s)",
        "Total Document Completion (%)",
        "Document Version",
      ].join(","),
    );

    // Add data rows
    exportData.forEach((view) => {
      if (view.documentViews.length === 0) {
        // Add a row for dataroom view without document views
        csvRows.push(
          [
            view.dataroomViewedAt,
            view.dataroomDownloadedAt,
            view.viewerName,
            view.viewerEmail,
            view.linkName,
            view.verified,
            view.agreementStatus,
            view.agreementName,
            view.agreementContent,
            view.agreementAcceptedAt,
            "No documents viewed",
            "",
            "",
            "",
            "",
            "",
          ].join(","),
        );
      } else {
        // Add a row for each document view
        view.documentViews.forEach((docView) => {
          csvRows.push(
            [
              view.dataroomViewedAt,
              view.dataroomDownloadedAt,
              view.viewerName,
              view.viewerEmail,
              view.linkName,
              view.verified,
              view.agreementStatus,
              view.agreementName,
              view.agreementContent,
              view.agreementAcceptedAt,
              docView.documentName,
              docView.viewedAt,
              docView.downloadedAt,
              (docView.duration / 1000).toFixed(1),
              docView.completionRate,
              docView.documentVersion,
            ].join(","),
          );
        });
      }
    });

    return res.status(200).json({
      dataroomName: dataroom.name,
      visits: csvRows.join("\n"),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
