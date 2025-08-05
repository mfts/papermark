import prisma from "@/lib/prisma";
import { SlackClient } from "./client";
import { createDigestMessage } from "./templates";
import { SlackEventData } from "./events";

export class SlackDigestProcessor {
    private client: SlackClient;

    constructor() {
        this.client = new SlackClient();
    }

    private async processTeamDigest(
        teamId: string,
        integrationId: string,
        notifications: any[]
    ): Promise<void> {
        if (!notifications || notifications.length === 0) {
            return;
        }


        try {
            const integration = await prisma.slackIntegration.findUnique({
                where: { id: integrationId },
            });

            if (!integration) {
                throw new Error(`Integration ${integrationId} not found`);
            }

            if (!integration.enabled) {
                await this.markNotificationsAsFailed(notifications.map(n => n.id));
                return;
            }

            if (!integration.accessToken) {
                throw new Error(`Integration ${integrationId} has no access token`);
            }

            const eventCounts = this.countEventsByType(notifications);

            if (eventCounts.length === 0) {
                await this.markNotificationsAsProcessed(notifications.map(n => n.id));
                return;
            }

            // Create digest message
            const digestMessage = await createDigestMessage(
                eventCounts.map(({ eventData, count }) => ({ eventData, count })),
                teamId
            );

            if (!digestMessage) {
                throw new Error(`Failed to create digest message for team ${teamId}`);
            }

            // Get channels to send to
            const channels = this.getDigestChannels(integration);

            if (channels.length === 0) {
                await this.markNotificationsAsProcessed(notifications.map(n => n.id));
                return;
            }

            let sentToChannels = 0;
            let failedChannels = 0;

            // Send digest to each channel
            for (const channel of channels) {
                try {
                    const slackMessage = {
                        ...digestMessage,
                        channel: channel.id
                    };

                    await this.client.sendMessage(integration.accessToken, slackMessage);
                    sentToChannels++;
                } catch (error) {
                    failedChannels++;
                    console.error(`[${new Date().toISOString()}] Error sending digest to channel ${channel.id}:`, error);
                }
            }

            if (sentToChannels > 0) {
                await this.markNotificationsAsProcessed(notifications.map(n => n.id));
            } else {
                throw new Error(`Failed to send digest to any channels for integration ${integrationId}`);
            }

        } catch (error) {
            throw error; 
        }
    }


    private countEventsByType(notifications: any[]): Array<{ eventData: SlackEventData; count: number }> {
        const eventCounts = new Map<string, { eventData: SlackEventData; count: number }>();

        for (const notification of notifications) {
            try {
                const eventData = notification.eventData as SlackEventData;

                if (!eventData || !eventData.eventType) {
                    console.warn(`[${new Date().toISOString()}] Invalid event data for notification ${notification.id}`);
                    continue;
                }

                const key = `${eventData.eventType}_${eventData.documentId || eventData.dataroomId || 'general'}`;

                if (eventCounts.has(key)) {
                    eventCounts.get(key)!.count++;
                } else {
                    eventCounts.set(key, { eventData, count: 1 });
                }
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error processing event data for notification ${notification.id}:`, error);
            }
        }

        return Array.from(eventCounts.values());
    }

    /**
     * Get channels for digest notifications
     */
    private getDigestChannels(integration: any): any[] {
        try {
            if (!integration?.enabledChannels) return [];

            const channels = Object.values(integration.enabledChannels)
                .filter((channel: any) => channel && channel.enabled)
                .filter((channel: any) => channel.notificationTypes && channel.notificationTypes.includes('digest'));

            return channels;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error getting digest channels for integration ${integration.id}:`, error);
            return [];
        }
    }

    /**
     * Mark notifications as processed
     */
    private async markNotificationsAsProcessed(notificationIds: string[]): Promise<void> {
        if (!notificationIds || notificationIds.length === 0) {
            return;
        }

        try {
            await prisma.slackNotification.updateMany({
                where: {
                    id: {
                        in: notificationIds,
                    },
                },
                data: {
                    status: 'PROCESSED',
                    processedAt: new Date(),
                },
            });
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error marking notifications as processed:`, error);
            throw error;
        }
    }

    /**
     * Mark notifications as failed
     */
    private async markNotificationsAsFailed(notificationIds: string[]): Promise<void> {
        if (!notificationIds || notificationIds.length === 0) {
            return;
        }

        try {
            await prisma.slackNotification.updateMany({
                where: {
                    id: {
                        in: notificationIds,
                    },
                },
                data: {
                    status: 'FAILED',
                    processedAt: new Date(),
                },
            });
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error marking notifications as failed:`, error);
            throw error;
        }
    }

    /**
     * Process digest for a specific integration by ID
     */
    async processIntegrationDigestById(integrationId: string): Promise<void> {
        const startTime = new Date();

        try {
            // Get the integration with pending notifications
            const integration = await prisma.slackIntegration.findUnique({
                where: { id: integrationId },
                include: {
                    team: true,
                },
            });

            if (!integration) {
                return;
            }

            if (!integration.enabled) {
                return;
            }

            if (integration.frequency === 'instant') {
                return;
            }

            // Get pending notifications for this integration
            const notifications = await prisma.slackNotification.findMany({
                where: {
                    slackIntegrationId: integrationId,
                    status: 'PENDING',
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });

            if (notifications.length === 0) {
                return;
            }

            // Process the digest for this integration
            await this.processTeamDigest(
                integration.teamId,
                integration.id,
                notifications
            );

        } catch (error) {
            throw error;
        }
    }

    /**
     * Clean up old processed notifications
     */
    async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
        const startTime = new Date();
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const result = await prisma.slackNotification.deleteMany({
                where: {
                    status: {
                        in: ['PROCESSED', 'FAILED'],
                    },
                    processedAt: {
                        lt: cutoffDate,
                    },
                },
            });

            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();

        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error cleaning up old notifications:`, error);
            throw error;
        }
    }
}

// Global instance
export const slackDigestProcessor = new SlackDigestProcessor();

export async function processSlackDigests(integrationId: string): Promise<void> {
    await slackDigestProcessor.processIntegrationDigestById(integrationId);
}

export async function cleanupSlackNotifications(daysToKeep: number = 30): Promise<void> {
    await slackDigestProcessor.cleanupOldNotifications(daysToKeep);
} 