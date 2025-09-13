import prisma from "@/lib/prisma";

import { SlackEventData, SlackMessage } from "./types";

/**
 * Helper function to safely reference a link with fallback handling
 * @param link - The link object that may have undefined or null properties
 * @returns Safe link reference string
 */
function linkRef(
  link: { name?: string | null; id?: string } | null | undefined,
): string {
  if (link?.name) {
    return `"${link.name}"`;
  }
  return `"Link ${link?.id?.slice(0, 5) ?? "unknown"}"`;
}

export async function createSlackMessage(
  eventData: SlackEventData,
): Promise<SlackMessage | null> {
  try {
    switch (eventData.eventType) {
      case "document_view":
        return await createDocumentViewMessage(eventData);
      case "dataroom_access":
        return await createDataroomAccessMessage(eventData);
      case "document_download":
        return await createDocumentDownloadMessage(eventData);

      default:
        return null;
    }
  } catch (error) {
    console.error("Error creating Slack message:", error);
    return null;
  }
}

/**
 * Document View Message Template
 */
async function createDocumentViewMessage(
  eventData: SlackEventData,
): Promise<SlackMessage> {
  const document = eventData.documentId
    ? await getDocumentInfo(eventData.documentId)
    : null;
  const dataroom = eventData.dataroomId
    ? await getDataroomInfo(eventData.dataroomId)
    : null;
  const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;

  const viewerDisplay = eventData.viewerEmail || "Anonymous";
  const viewerMention = eventData.viewerEmail
    ? `<mailto:${eventData.viewerEmail}|${viewerDisplay}>`
    : viewerDisplay;

  let accessContext = "";
  if (eventData.dataroomId && dataroom) {
    accessContext = `in dataroom "${dataroom.name}"`;
  } else {
    accessContext = `via shared link ${linkRef(link)}`;
  }

  return {
    text: `Your document has been viewed: ${document?.name || "Unknown document"} by ${viewerDisplay} ${accessContext}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Your document has been viewed",
          emoji: false,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Document:*\n${document?.name || "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Viewer:*\n${viewerMention}`,
          },
        ],
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: dataroom?.name
              ? `*Dataroom:*\n${dataroom.name}`
              : link?.name
                ? `*Shared Link:*\n${link.name}`
                : `*Access:*\nDirect access`,
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${new Date().toLocaleString()}`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: eventData.dataroomId
              ? `Viewed document in dataroom "${dataroom?.name || "Unknown"}"`
              : `Viewed document via shared link ${linkRef(link)}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View document",
              emoji: true,
            },
            style: "primary",
            url: eventData.documentId
              ? `${process.env.NEXTAUTH_URL}/documents/${eventData.documentId}`
              : `${process.env.NEXTAUTH_URL}/dashboard`,
          },
        ],
      },
    ],
  };
}

/**
 * Dataroom Access Message Template
 */
async function createDataroomAccessMessage(
  eventData: SlackEventData,
): Promise<SlackMessage> {
  const dataroom = eventData.dataroomId
    ? await getDataroomInfo(eventData.dataroomId)
    : null;
  const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;

  const viewerDisplay = eventData.viewerEmail || "Anonymous";
  const viewerMention = eventData.viewerEmail
    ? `<mailto:${eventData.viewerEmail}|${viewerDisplay}>`
    : viewerDisplay;

  const accessContext = `via shared link ${linkRef(link)}`;

  return {
    text: `Your dataroom has been viewed: ${dataroom?.name || "Unknown dataroom"} by ${viewerDisplay} ${accessContext}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Your dataroom has been viewed",
          emoji: false,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Dataroom:*\n${dataroom?.name || "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Viewer:*\n${viewerMention}`,
          },
        ],
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: link?.name
              ? `*Shared Link:*\n${link.name}`
              : `*Access:*\nDirect access`,
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${new Date().toLocaleString()}`,
          },
        ],
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Documents:*\n${dataroom?.documentCount || 0} documents`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Dataroom accessed via shared link ${linkRef(link)}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View dataroom",
              emoji: true,
            },
            style: "primary",
            url: eventData.dataroomId
              ? `${process.env.NEXTAUTH_URL}/datarooms/${eventData.dataroomId}`
              : `${process.env.NEXTAUTH_URL}/dashboard`,
          },
        ],
      },
    ],
  };
}

/**
 * Document Download Message Template
 */
async function createDocumentDownloadMessage(
  eventData: SlackEventData,
): Promise<SlackMessage> {
  const document = eventData.documentId
    ? await getDocumentInfo(eventData.documentId)
    : null;
  const dataroom = eventData.dataroomId
    ? await getDataroomInfo(eventData.dataroomId)
    : null;
  const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;

  const viewerDisplay = eventData.viewerEmail || "Anonymous";
  const viewerMention = eventData.viewerEmail
    ? `<mailto:${eventData.viewerEmail}|${viewerDisplay}>`
    : viewerDisplay;

  const isBulkDownload = eventData.metadata?.isBulkDownload;
  const isFolderDownload = eventData.metadata?.isFolderDownload;
  const folderName = eventData.metadata?.folderName;
  const documentCount = eventData.metadata?.documentCount;

  let downloadType = "Document";
  let downloadContext = "";

  if (isBulkDownload) {
    downloadType = "Dataroom";
    downloadContext = `(${documentCount} documents)`;
  } else if (isFolderDownload) {
    downloadType = "Folder";
    downloadContext = `"${folderName}" (${documentCount} documents)`;
  } else if (dataroom) {
    downloadContext = `from dataroom "${dataroom.name}"`;
  } else {
    downloadContext = `via shared link ${linkRef(link)}`;
  }

  return {
    text: `${downloadType} has been downloaded: ${document?.name || downloadContext} by ${viewerDisplay}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${downloadType} has been downloaded`,
          emoji: false,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: document?.name
              ? `*${downloadType}:*\n${document.name}`
              : `*${downloadType}:*\n${downloadContext}`,
          },
          {
            type: "mrkdwn",
            text: `*Downloaded by:*\n${viewerMention}`,
          },
        ],
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: dataroom?.name
              ? `*From Dataroom:*\n${dataroom.name}`
              : link?.name
                ? `*Shared Link:*\n${link.name}`
                : `*Context:*\n${downloadContext}`,
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${new Date().toLocaleString()}`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: isBulkDownload
              ? `Bulk dataroom download`
              : isFolderDownload
                ? `Folder download`
                : `Document download via shared link ${linkRef(link)}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View activity",
              emoji: true,
            },
            style: "primary",
            url: eventData.dataroomId
              ? `${process.env.NEXTAUTH_URL}/datarooms/${eventData.dataroomId}`
              : eventData.documentId
                ? `${process.env.NEXTAUTH_URL}/documents/${eventData.documentId}`
                : `${process.env.NEXTAUTH_URL}/dashboard`,
          },
        ],
      },
    ],
  };
}

// Helper functions
async function getDocumentInfo(documentId: string) {
  try {
    return await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
      },
    });
  } catch (error) {
    console.error("Error fetching document info:", error);
    return null;
  }
}

async function getDataroomInfo(dataroomId: string) {
  try {
    return await prisma.dataroom
      .findUnique({
        where: { id: dataroomId },
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: {
              documents: true,
            },
          },
        },
      })
      .then((dataroom) =>
        dataroom
          ? {
              ...dataroom,
              documentCount: dataroom._count.documents,
            }
          : null,
      );
  } catch (error) {
    console.error("Error fetching dataroom info:", error);
    return null;
  }
}

async function getLinkInfo(linkId: string) {
  try {
    return await prisma.link.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        name: true,
        linkType: true,
      },
    });
  } catch (error) {
    console.error("Error fetching link info:", error);
    return null;
  }
}

async function getViewInfo(viewId: string) {
  try {
    return await prisma.view.findUnique({
      where: { id: viewId },
      select: {
        id: true,
        viewerEmail: true,
        viewerId: true,
        viewedAt: true,
        viewType: true,
        documentId: true,
        dataroomId: true,
      },
    });
  } catch (error) {
    console.error("Error fetching view info:", error);
    return null;
  }
}
