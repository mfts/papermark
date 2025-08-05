import { SlackEventData } from "./events";

export interface SlackChannelConfig {
    id: string;
    name: string;
    enabled: boolean;
    notificationTypes: string[];
}

export interface SlackMessage {
    channel?: string;
    text?: string;
    blocks?: any[];
    thread_ts?: string;
    unfurl_links?: boolean;
    unfurl_media?: boolean;
}

export async function createSlackMessage(
    eventData: SlackEventData,
    channel: SlackChannelConfig
): Promise<SlackMessage | null> {
    try {
        switch (eventData.eventType) {
            case 'document_view':
                return await createDocumentViewMessage(eventData);
            case 'dataroom_access':
                return await createDataroomAccessMessage(eventData);
            case 'document_download':
                return await createDocumentDownloadMessage(eventData);
            case 'document_reaction':
                return await createDocumentReactionMessage(eventData);
            default:
                return null;
        }
    } catch (error) {
        console.error('Error creating Slack message:', error);
        return null;
    }
}

/**
 * Document View Message Template
 */
async function createDocumentViewMessage(eventData: SlackEventData): Promise<SlackMessage> {
    const document = eventData.documentId ? await getDocumentInfo(eventData.documentId) : null;
    const dataroom = eventData.dataroomId ? await getDataroomInfo(eventData.dataroomId) : null;
    const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;

    const viewerDisplay = eventData.viewerEmail || 'Anonymous';
    const viewerMention = eventData.viewerEmail ? `<mailto:${eventData.viewerEmail}|${viewerDisplay}>` : viewerDisplay;

    let accessContext = "";
    if (eventData.dataroomId && dataroom) {
        accessContext = `in dataroom "${dataroom.name}"`;
    } else if (link?.name) {
        accessContext = `via shared link "${link.name}"`;
    } else {
        accessContext = `via shared link "Link ${link?.id.slice(0, 5)}"`;
    }

    return {
        text: `Your document has been viewed: ${document?.name || 'Unknown document'} by ${viewerDisplay} ${accessContext}`,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "Your document has been viewed",
                    emoji: false
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Document:*\n${document?.name || 'Unknown'}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Viewer:*\n${viewerMention}`
                    }
                ]
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
                                : `*Access:*\nDirect access`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Time:*\n${new Date().toLocaleString()}`
                    }
                ]
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: eventData.dataroomId
                            ? `Viewed document in dataroom "${dataroom?.name || 'Unknown'}"`
                            : link?.name
                                ? `Viewed document via shared link "${link.name}"`
                                : `Viewed document via shared link "Link ${link?.id.slice(0, 5)}"`
                    }
                ]
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "View document",
                            emoji: true
                        },
                        style: "primary",
                        url: eventData.documentId
                            ? `${process.env.NEXTAUTH_URL}/documents/${eventData.documentId}`
                            : `${process.env.NEXTAUTH_URL}/dashboard`
                    }
                ]
            }
        ]
    };
}

/**
 * Dataroom Access Message Template
 */
async function createDataroomAccessMessage(eventData: SlackEventData): Promise<SlackMessage> {
    const dataroom = eventData.dataroomId ? await getDataroomInfo(eventData.dataroomId) : null;
    const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;

    const viewerDisplay = eventData.viewerEmail || 'Anonymous';
    const viewerMention = eventData.viewerEmail ? `<mailto:${eventData.viewerEmail}|${viewerDisplay}>` : viewerDisplay;


    const accessContext = link?.name ? `via shared link "${link.name}"` : `via shared link "Link ${link?.id.slice(0, 5)}"`;

    return {
        text: `Your dataroom has been viewed: ${dataroom?.name || 'Unknown dataroom'} by ${viewerDisplay} ${accessContext}`,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "Your dataroom has been viewed",
                    emoji: false
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Dataroom:*\n${dataroom?.name || 'Unknown'}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Viewer:*\n${viewerMention}`
                    }
                ]
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: link?.name
                            ? `*Shared Link:*\n${link.name}`
                            : `*Access:*\nDirect access`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Time:*\n${new Date().toLocaleString()}`
                    }
                ]
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Documents:*\n${dataroom?.documentCount || 0} documents`
                    }
                ]
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: link?.name
                            ? `Dataroom accessed via shared link "${link.name}"`
                            : `Dataroom accessed via shared link "Link ${link?.id.slice(0, 5)}"`
                    }
                ]
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "View dataroom",
                            emoji: true
                        },
                        style: "primary",
                        url: eventData.dataroomId
                            ? `${process.env.NEXTAUTH_URL}/datarooms/${eventData.dataroomId}`
                            : `${process.env.NEXTAUTH_URL}/dashboard`
                    }
                ]
            }
        ]
    };
}



/**
 * Document Download Message Template
 */
async function createDocumentDownloadMessage(eventData: SlackEventData): Promise<SlackMessage> {
    const document = eventData.documentId ? await getDocumentInfo(eventData.documentId) : null;
    const dataroom = eventData.dataroomId ? await getDataroomInfo(eventData.dataroomId) : null;
    const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;

    const viewerDisplay = eventData.viewerEmail || 'Anonymous';
    const viewerMention = eventData.viewerEmail ? `<mailto:${eventData.viewerEmail}|${viewerDisplay}>` : viewerDisplay;


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
    } else if (link?.name) {
        downloadContext = `via shared link "${link.name}"`;
    } else {
        downloadContext = `via shared link "Link ${link?.id.slice(0, 5)}"`;
    }

    return {
        text: `${downloadType} has been downloaded: ${document?.name || downloadContext} by ${viewerDisplay}`,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `${downloadType} has been downloaded`,
                    emoji: false
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: document?.name
                            ? `*${downloadType}:*\n${document.name}`
                            : `*${downloadType}:*\n${downloadContext}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Downloaded by:*\n${viewerMention}`
                    }
                ]
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
                                : `*Context:*\n${downloadContext}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Time:*\n${new Date().toLocaleString()}`
                    }
                ]
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
                                : link?.name
                                    ? `Document download via shared link "${link.name}"`
                                    : `Document download via shared link "Link ${link?.id.slice(0, 5)}"`
                    }
                ]
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "View activity",
                            emoji: true
                        },
                        style: "primary",
                        url: eventData.dataroomId
                            ? `${process.env.NEXTAUTH_URL}/datarooms/${eventData.dataroomId}`
                            : eventData.documentId
                                ? `${process.env.NEXTAUTH_URL}/documents/${eventData.documentId}`
                                : `${process.env.NEXTAUTH_URL}/dashboard`
                    }
                ]
            }
        ]
    };
}

/**
 * Document Reaction Message Template
 */
async function createDocumentReactionMessage(eventData: SlackEventData): Promise<SlackMessage> {
    const document = eventData.documentId ? await getDocumentInfo(eventData.documentId) : null;
    const link = eventData.linkId ? await getLinkInfo(eventData.linkId) : null;
    const reaction = eventData.metadata?.reaction || 'Unknown';

    // Create viewer mention with email link if available
    const viewerDisplay = eventData.viewerEmail || 'Anonymous';
    const viewerMention = eventData.viewerEmail ? `<mailto:${eventData.viewerEmail}|${viewerDisplay}>` : viewerDisplay;

    // Determine access context
    const accessContext = link?.name ? `via shared link "${link.name}"` : `via shared link "Link ${link?.id.slice(0, 5)}"`;

    return {
        text: `A reaction has been added to document: ${reaction} on ${document?.name || 'Unknown document'} by ${viewerDisplay} ${accessContext}`,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "A reaction has been added to document",
                    emoji: false
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Document:*\n${document?.name || 'Unknown'}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Reaction:*\n${reaction}`
                    }
                ]
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*By:*\n${viewerMention}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Time:*\n${new Date().toLocaleString()}`
                    }
                ]
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: link?.name
                            ? `*Shared Link:*\n${link.name}`
                            : `*Access:*\nDirect access`
                    }
                ]
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: link?.name
                            ? `Reaction added via shared link "${link.name}"`
                            : `Reaction added via shared link "Link ${link?.id.slice(0, 5)}"`
                    }
                ]
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "View document",
                            emoji: true
                        },
                        style: "primary",
                        url: eventData.documentId
                            ? `${process.env.NEXTAUTH_URL}/documents/${eventData.documentId}`
                            : `${process.env.NEXTAUTH_URL}/dashboard`
                    }
                ]
            }
        ]
    };
}

/**
 * Create a digest message for multiple events
 */
export async function createDigestMessage(
    events: Array<{ eventData: SlackEventData; count: number }>,
    teamId: string,
): Promise<SlackMessage> {
    const team = await getTeamInfo(teamId);

    // Get detailed activity breakdown
    const activityDetails = await generateActivityDetails(events, teamId);

    const summaryBlocks = [];

    // Header
    summaryBlocks.push({
        type: "header",
        text: {
            type: "plain_text",
            text: `${team?.name || 'Team'} Activity Summary`,
            emoji: false
        }
    });

    // Summary stats
    const totalEvents = events.reduce((sum, { count }) => sum + count, 0);
    summaryBlocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `*${totalEvents} total activities* in this period`
        }
    });

    // Document activities
    if (activityDetails.documentActivities.length > 0) {
        const documentText = activityDetails.documentActivities
            .map(activity => {
                const action = getActivityAction(activity.eventType);
                return `• *${activity.documentName}* - ${action} by ${activity.viewerEmail || 'Unknown user'}`;
            })
            .join('\n');

        summaryBlocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Document Activities:*\n${documentText}`
            }
        });
    }

    // Dataroom activities
    if (activityDetails.dataroomActivities.length > 0) {
        const dataroomText = activityDetails.dataroomActivities
            .map(activity => {
                return `• *${activity.dataroomName}* - accessed by ${activity.viewerEmail || 'Unknown user'}`;
            })
            .join('\n');

        summaryBlocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Dataroom Activities:*\n${dataroomText}`
            }
        });
    }

    // Link activities
    if (activityDetails.linkActivities.length > 0) {
        const linkText = activityDetails.linkActivities
            .map(activity => {
                const action = getActivityAction(activity.eventType);
                return `• *${activity.linkName}* - ${action} by ${activity.viewerEmail || 'Unknown user'}`;
            })
            .join('\n');

        summaryBlocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Link Activities:*\n${linkText}`
            }
        });
    }

    // Dashboard button
    summaryBlocks.push({
        type: "actions",
        elements: [
            {
                type: "button",
                text: {
                    type: "plain_text",
                    text: "View Dashboard",
                    emoji: false
                },
                style: "primary",
                url: `${process.env.NEXTAUTH_URL}/dashboard`
            }
        ]
    });

    return {
        text: `${team?.name || 'Team'} Activity Summary - ${totalEvents} activities`,
        blocks: summaryBlocks
    };
}

/**
 * Generate detailed activity breakdown from events
 */
async function generateActivityDetails(
    events: Array<{ eventData: SlackEventData; count: number }>,
    teamId: string
): Promise<{
    documentActivities: Array<{
        eventType: string;
        documentName: string;
        viewerEmail?: string;
    }>;
    dataroomActivities: Array<{
        dataroomName: string;
        viewerEmail?: string;
    }>;
    linkActivities: Array<{
        eventType: string;
        linkName: string;
        viewerEmail?: string;
    }>;
}> {
    const documentActivities: Array<{
        eventType: string;
        documentName: string;
        viewerEmail?: string;
    }> = [];

    const dataroomActivities: Array<{
        dataroomName: string;
        viewerEmail?: string;
    }> = [];

    const linkActivities: Array<{
        eventType: string;
        linkName: string;
        viewerEmail?: string;
    }> = [];

    // Process each event
    for (const { eventData, count } of events) {
        // Handle multiple occurrences of the same event
        for (let i = 0; i < count; i++) {
            if (eventData.documentId) {
                const doc = await getDocumentInfo(eventData.documentId);
                documentActivities.push({
                    eventType: eventData.eventType,
                    documentName: doc?.name || 'Unknown Document',
                    viewerEmail: eventData.viewerEmail
                });
            } else if (eventData.dataroomId) {
                const dataroom = await getDataroomInfo(eventData.dataroomId);
                dataroomActivities.push({
                    dataroomName: dataroom?.name || 'Unknown Dataroom',
                    viewerEmail: eventData.viewerEmail
                });
            } else if (eventData.linkId) {
                const link = await getLinkInfo(eventData.linkId);
                linkActivities.push({
                    eventType: eventData.eventType,
                    linkName: link?.name || 'Unknown Link',
                    viewerEmail: eventData.viewerEmail
                });
            }
        }
    }

    return {
        documentActivities,
        dataroomActivities,
        linkActivities
    };
}

/**
 * Get action description for activity type
 */
function getActivityAction(eventType: string): string {
    switch (eventType) {
        case 'document_view':
            return 'viewed';
        case 'document_download':
            return 'downloaded';
        case 'document_reaction':
            return 'reacted to';
        case 'dataroom_access':
            return 'accessed';
        default:
            return 'interacted with';
    }
}

// Helper functions
async function getDocumentInfo(documentId: string) {
    try {
        const prisma = (await import("@/lib/prisma")).default;
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
        console.error('Error fetching document info:', error);
        return null;
    }
}

async function getDataroomInfo(dataroomId: string) {
    try {
        const prisma = (await import("@/lib/prisma")).default;
        return await prisma.dataroom.findUnique({
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
        }).then(dataroom => dataroom ? {
            ...dataroom,
            documentCount: dataroom._count.documents,
        } : null);
    } catch (error) {
        console.error('Error fetching dataroom info:', error);
        return null;
    }
}

async function getUserInfo(userId: string) {
    try {
        const prisma = (await import("@/lib/prisma")).default;
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}

async function getTeamInfo(teamId: string) {
    try {
        const prisma = (await import("@/lib/prisma")).default;
        return await prisma.team.findUnique({
            where: { id: teamId },
            select: {
                id: true,
                name: true,
            },
        });
    } catch (error) {
        console.error('Error fetching team info:', error);
        return null;
    }
}

async function getLinkInfo(linkId: string) {
    try {
        const prisma = (await import("@/lib/prisma")).default;
        return await prisma.link.findUnique({
            where: { id: linkId },
            select: {
                id: true,
                name: true,
                linkType: true,
            },
        });
    } catch (error) {
        console.error('Error fetching link info:', error);
        return null;
    }
}

function getEventDisplayName(eventType: string): string {
    switch (eventType) {
        case 'document_view': return 'Document Views';
        case 'dataroom_access': return 'Dataroom Access';
        case 'document_download': return 'Document Downloads';
        case 'document_reaction': return 'Document Reactions';
        default: return 'Unknown Events';
    }
} 