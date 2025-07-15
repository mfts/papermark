import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import {
  getViewPageDuration,
  getViewUserAgent,
  getViewUserAgent_v2,
} from "@/lib/tinybird";

export const config = {
  maxDuration: 180,
};

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/documents/:id/export-visits
    const { id: docId } = req.query as { id: string };

    try {
      // Check if team plan includes "free" - this is the business logic
      if (req.team?.plan?.includes("free")) {
        res
          .status(403)
          .json({ message: "This feature is not available for your plan" });
        return;
      }

      // Fetching Document based on document.id
      const document = await prisma.document.findUnique({
        where: { id: docId, teamId: req.team!.id },
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
        res.status(404).end("Document not found");
        return;
      }

      // Fetch views data from the database
      const views = await prisma.view.findMany({
        where: { documentId: docId },
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
          customFieldResponse: {
            select: {
              data: true,
            },
          },
        },
        orderBy: {
          viewedAt: "desc",
        },
      });

      if (!views || views.length === 0) {
        res.status(404).end("Document has no views");
        return;
      }

      const isProPlan = req.team?.plan?.includes("pro");

      // Create CSV rows array starting with headers
      const csvRows: string[] = [];
      const headers = [
        "Viewed at",
        "Name",
        "Email",
        "Link Name",
        "Total Visit Duration (s)",
        "Total Document Completion (%)",
        "Document version",
        "Downloaded at",
        "Verified",
        "Agreement Accepted",
        "Agreement Name",
        "Agreement Content",
        "Agreement Accepted At",
        "Viewed from dataroom",
        "Browser",
        "OS",
        "Device",
      ];

      if (!isProPlan) {
        headers.push("Country", "City", "Custom Fields");
      }

      csvRows.push(headers.join(","));

      // Fetch all durations in parallel
      const durations = await Promise.all(
        views.map((view) =>
          getViewPageDuration({
            documentId: docId,
            viewId: view.id,
            since: 0,
          }),
        ),
      );

      const userAgentData = await Promise.all(
        views.map(async (view) => {
          const result = await getViewUserAgent({
            viewId: view.id,
          });

          if (!result || result.rows === 0) {
            return getViewUserAgent_v2({
              documentId: docId,
              viewId: view.id,
              since: 0,
            });
          }

          return result;
        }),
      );
      // Process each view and add to CSV rows
      views.forEach((view, index) => {
        const relevantDocumentVersion = document.versions.find(
          (version) => version.createdAt <= view.viewedAt,
        );

        const numPages =
          relevantDocumentVersion?.numPages || document.numPages || 0;
        const completionRate = numPages
          ? (durations[index].data.length / numPages) * 100
          : 0;

        const totalDuration = durations[index].data.reduce(
          (total, data) => total + data.sum_duration,
          0,
        );

        const rowData = [
          view.viewedAt.toISOString(),
          view.viewerName || "NaN",
          view.viewerEmail || "NaN",
          view.link?.name || "NaN",
          (totalDuration / 1000.0).toFixed(1),
          completionRate.toFixed(2) + "%",
          relevantDocumentVersion?.versionNumber ||
          document.versions[0]?.versionNumber ||
          "NaN",
          view.downloadedAt ? view.downloadedAt.toISOString() : "NaN",
          view.verified ? "Yes" : "No",
          view.agreementResponse ? "Yes" : "NaN",
          view.agreementResponse?.agreement.name || "NaN",
          view.agreementResponse?.agreement.content || "NaN",
          view.agreementResponse?.createdAt.toISOString() || "NaN",
          view.dataroomId ? "Yes" : "No",
          userAgentData[index]?.data[0]?.browser || "NaN",
          userAgentData[index]?.data[0]?.os || "NaN",
          userAgentData[index]?.data[0]?.device || "NaN",
        ];

        if (!isProPlan) {
          rowData.push(
            userAgentData[index]?.data[0]?.country || "NaN",
            userAgentData[index]?.data[0]?.city || "NaN",
            view.customFieldResponse?.data
              ? `"${JSON.stringify(view.customFieldResponse.data).replace(/"/g, '""')}"`
              : "NaN",
          );
        }

        csvRows.push(rowData.join(","));
      });

      res.status(200).json({
        documentName: document.name,
        visits: csvRows.join("\n"),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },
});
