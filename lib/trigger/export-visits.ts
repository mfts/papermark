import { logger, task } from "@trigger.dev/sdk/v3";
import { put } from "@vercel/blob";
import Bottleneck from "bottleneck";

import { sendExportReadyEmail } from "@/lib/emails/send-export-ready-email";
import prisma from "@/lib/prisma";
import { jobStore } from "@/lib/redis-job-store";
import {
  getViewPageDuration,
  getViewUserAgent,
  getViewUserAgent_v2,
} from "@/lib/tinybird";

// Create a bottleneck instance to limit tinybird API calls
const tinybirdLimiter = new Bottleneck({
  maxConcurrent: 5, // Maximum 5 concurrent requests
  minTime: 200, // Minimum 200ms between requests
});

export type ExportVisitsPayload = {
  type: "document" | "dataroom" | "dataroom-group";
  teamId: string;
  resourceId: string; // document ID or dataroom ID
  groupId?: string; // for dataroom groups
  userId: string;
  exportId: string; // unique identifier for this export job
};

export const exportVisitsTask = task({
  id: "export-visits",
  retry: { maxAttempts: 3 },
  maxDuration: 900, // 15 minutes to handle large datasets
  run: async (payload: ExportVisitsPayload) => {
    const { type, teamId, resourceId, groupId, userId, exportId } = payload;

    logger.info("Starting export visits task", { payload });

    try {
      // Update job status to processing
      await jobStore.updateJob(exportId, { status: "PROCESSING" });

      // Verify team access
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
        throw new Error("Team not found or access denied");
      }

      if (team.plan === "free") {
        throw new Error("This feature is not available for your plan");
      }

      let csvData: string;
      let resourceName: string;

      if (type === "document") {
        ({ csvData, resourceName } = await exportDocumentVisits(
          resourceId,
          teamId,
        ));
      } else if (type === "dataroom") {
        ({ csvData, resourceName } = await exportDataroomVisits(
          resourceId,
          teamId,
          groupId,
        ));
      } else {
        throw new Error("Invalid export type");
      }

      // Create timestamp for filename
      const currentTime = new Date().toISOString().split("T")[0];

      // Upload CSV to Vercel Blob
      const filename = `visits-${resourceName.replace(/[^a-zA-Z0-9]/g, "_")}-${currentTime}.csv`;
      const blob = await put(filename, csvData, {
        access: "public",
        addRandomSuffix: true,
        contentType: "text/csv",
      });

      logger.info("CSV uploaded to Vercel Blob", {
        filename,
        url: blob.downloadUrl,
        size: csvData.length,
      });

      // Store the blob URL in Redis
      const updatedJob = await jobStore.updateJob(exportId, {
        status: "COMPLETED",
        result: blob.downloadUrl,
        resourceName,
        completedAt: new Date().toISOString(),
      });

      // Send email notification if requested
      if (updatedJob?.emailNotification && updatedJob.emailAddress) {
        try {
          await sendExportReadyEmail({
            to: updatedJob.emailAddress,
            resourceName: resourceName,
            downloadUrl: `${process.env.NEXTAUTH_URL}/api/teams/${teamId}/export-jobs/${exportId}?download=true`,
          });
          logger.info("Export ready email sent", {
            exportId,
            emailAddress: updatedJob.emailAddress,
          });
        } catch (error) {
          logger.error("Failed to send export ready email", {
            exportId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info("Export visits task completed successfully", {
        exportId,
        type,
        resourceId,
        csvSize: csvData.length,
        blobUrl: blob.downloadUrl,
      });

      return {
        success: true,
        exportId,
        resourceName,
        csvSize: csvData.length,
        blobUrl: blob.downloadUrl,
      };
    } catch (error) {
      logger.error("Export visits task failed", {
        exportId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Update job status to failed
      await jobStore.updateJob(exportId, {
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  },
});

async function exportDocumentVisits(
  docId: string,
  teamId: string,
): Promise<{
  csvData: string;
  resourceName: string;
}> {
  // Fetch Document
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
      team: {
        select: {
          plan: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Fetch views
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
    throw new Error("Document has no views");
  }

  const isProPlan = document.team.plan.includes("pro");

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

  // Process views with rate limiting
  logger.info("Processing document views with rate limiting", {
    viewCount: views.length,
  });

  for (let i = 0; i < views.length; i++) {
    const view = views[i];

    logger.info(`Processing view ${i + 1}/${views.length}`, {
      viewId: view.id,
      viewedAt: view.viewedAt,
    });

    // Rate-limited calls to tinybird
    const [duration, userAgentData] = await Promise.all([
      tinybirdLimiter.schedule(() =>
        getViewPageDuration({
          documentId: docId,
          viewId: view.id,
          since: 0,
        }),
      ),
      tinybirdLimiter.schedule(async () => {
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
    ]);

    const relevantDocumentVersion = document.versions.find(
      (version) => version.createdAt <= view.viewedAt,
    );

    const numPages =
      relevantDocumentVersion?.numPages || document.numPages || 0;
    const completionRate = numPages
      ? (duration.data.length / numPages) * 100
      : 0;

    const totalDuration = duration.data.reduce(
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
      userAgentData?.data[0]?.browser || "NaN",
      userAgentData?.data[0]?.os || "NaN",
      userAgentData?.data[0]?.device || "NaN",
    ];

    if (!isProPlan) {
      rowData.push(
        userAgentData?.data[0]?.country || "NaN",
        userAgentData?.data[0]?.city || "NaN",
        view.customFieldResponse?.data
          ? `"${JSON.stringify(view.customFieldResponse.data).replace(/"/g, '""')}"`
          : "NaN",
      );
    }

    csvRows.push(rowData.join(","));
  }

  return {
    csvData: csvRows.join("\n"),
    resourceName: document.name,
  };
}

async function exportDataroomVisits(
  dataroomId: string,
  teamId: string,
  groupId?: string,
): Promise<{
  csvData: string;
  resourceName: string;
}> {
  // Fetch Dataroom
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
    throw new Error("Dataroom not found");
  }

  // Fetch views
  const views = await prisma.view.findMany({
    where: {
      dataroomId: dataroomId,
      ...(groupId && { groupId }),
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
    throw new Error("Dataroom has no views");
  }

  // First get all dataroom views
  const dataroomViews = views.filter(
    (view) => view.viewType === "DATAROOM_VIEW",
  );
  const documentViews = views.filter(
    (view) => view.viewType === "DOCUMENT_VIEW",
  );

  logger.info("Processing dataroom views with rate limiting", {
    dataroomViewCount: dataroomViews.length,
    documentViewCount: documentViews.length,
  });

  // Process dataroom views
  const exportData = [];
  for (let i = 0; i < dataroomViews.length; i++) {
    const dataroomView = dataroomViews[i];

    logger.info(`Processing dataroom view ${i + 1}/${dataroomViews.length}`, {
      viewId: dataroomView.id,
    });

    // Find associated document views
    const associatedDocViews = documentViews.filter(
      (docView) => docView.dataroomViewId === dataroomView.id,
    );

    // Process document views with rate limiting
    const documentViewDetails = [];
    for (let j = 0; j < associatedDocViews.length; j++) {
      const docView = associatedDocViews[j];

      logger.info(
        `Processing document view ${j + 1}/${associatedDocViews.length} for dataroom view ${i + 1}`,
        {
          docViewId: docView.id,
        },
      );

      const duration = await tinybirdLimiter.schedule(() =>
        getViewPageDuration({
          documentId: docView.document?.id || "null",
          viewId: docView.id,
          since: 0,
        }),
      );

      const relevantVersion = docView.document?.versions.find(
        (version) => version.createdAt <= docView.viewedAt,
      );

      const numPages =
        relevantVersion?.numPages || docView.document?.numPages || 0;
      const completionRate = numPages
        ? (duration.data.length / numPages) * 100
        : 0;

      documentViewDetails.push({
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
        viewId: docView.id,
      });
    }

    exportData.push({
      dataroomViewedAt: dataroomView.viewedAt.toISOString(),
      dataroomDownloadedAt: dataroomView.downloadedAt?.toISOString() || "NaN",
      viewerName: dataroomView.viewerName || "NaN",
      viewerEmail: dataroomView.viewerEmail || "NaN",
      linkName: dataroomView.link?.name || "NaN",
      verified: dataroomView.verified ? "Yes" : "NaN",
      agreementStatus: dataroomView.agreementResponse ? "Yes" : "NaN",
      agreementName: dataroomView.agreementResponse?.agreement.name || "NaN",
      agreementAcceptedAt:
        dataroomView.agreementResponse?.createdAt.toISOString() || "NaN",
      agreementContent:
        dataroomView.agreementResponse?.agreement.content || "NaN",
      documentViews: documentViewDetails,
    });
  }

  // Get user agent data for all document views at once with rate limiting
  const userAgentDataMap = new Map();
  for (const docView of documentViews) {
    const userAgentData = await tinybirdLimiter.schedule(async () => {
      const result = await getViewUserAgent({
        viewId: docView.id,
      });

      if (!result || result.rows === 0) {
        return getViewUserAgent_v2({
          documentId: docView.document?.id || "null",
          viewId: docView.id,
          since: 0,
        });
      }

      return result;
    });

    userAgentDataMap.set(docView.id, userAgentData);
  }

  // Create CSV
  const csvRows: string[] = [];
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
      "Browser",
      "OS",
      "Device",
      "Country",
      "City",
    ].join(","),
  );

  exportData.forEach((view) => {
    if (view.documentViews.length === 0) {
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
          "NaN",
          "NaN",
          "NaN",
          "NaN",
          "NaN",
          "NaN",
          "NaN",
          "NaN",
          "NaN",
          "NaN",
          "NaN",
        ].join(","),
      );
    } else {
      view.documentViews.forEach((docView) => {
        const userAgentData = userAgentDataMap.get(docView.viewId);

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
            userAgentData?.data[0]?.browser || "NaN",
            userAgentData?.data[0]?.os || "NaN",
            userAgentData?.data[0]?.device || "NaN",
            userAgentData?.data[0]?.country || "NaN",
            userAgentData?.data[0]?.city || "NaN",
          ].join(","),
        );
      });
    }
  });

  return {
    csvData: csvRows.join("\n"),
    resourceName: dataroom.name,
  };
}
