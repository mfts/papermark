import { SlackIntegration } from "@prisma/client";
import { SlackClient } from "./client";
import { createSlackMessage } from "./templates";
import prisma from "@/lib/prisma";

export interface SlackEventData {
    teamId: string;
    eventType: string;
    documentId?: string;
    dataroomId?: string;
    linkId?: string;
    viewerEmail?: string;
    viewerId?: string;
    userId?: string;
    metadata?: Record<string, any>;
}

export class SlackEventManager {
    private client: SlackClient;

    constructor() {
        this.client = new SlackClient();
    }


    async processEvent(eventData: SlackEventData): Promise<void> {
        try {

            const integration = await this.getSlackIntegration(eventData.teamId);
            if (!integration || !integration.enabled) {
                return;
            }


            if (!this.isEventTypeEnabled(eventData.eventType, integration)) {
                return;
            }

            await this.sendInstantNotification(eventData, integration);

        } catch (error) {
            console.error('Error processing Slack event:', error);
        }
    }

    /**
     * Send instant notification for an event
     */
    private async sendInstantNotification(
        eventData: SlackEventData,
        integration: SlackIntegration
    ): Promise<void> {
        try {
            const channels = await this.getNotificationChannels(eventData, integration);

            if (channels.length === 0) {
                return;
            }


            for (const channel of channels) {
                try {
                    const message = await createSlackMessage(eventData);
                    if (message) {
                        const slackMessage = {
                            ...message,
                            channel: channel.id
                        };
                        await this.client.sendMessage(integration.accessToken, slackMessage);
                    }
                } catch (channelError) {
                    console.error(`Error sending to channel ${channel.name || channel.id}:`, channelError);
                }
            }
        } catch (error) {
            console.error('Error sending instant notification:', error);
        }
    }



    private async getSlackIntegration(teamId: string): Promise<SlackIntegration | null> {
        return await prisma.slackIntegration.findFirst({
            where: { teamId, enabled: true },
        });
    }


    private isEventTypeEnabled(
        eventType: string,
        integration: any
    ): boolean {
        const notificationTypes = integration.notificationTypes || {};
        return notificationTypes[eventType] || false;
    }

    private async getNotificationChannels(
        eventData: SlackEventData,
        integration: SlackIntegration
    ): Promise<any[]> {
        const enabledChannels = integration.enabledChannels || {};
        return Object.values(enabledChannels)
            .filter((channel: any) => channel.enabled)
            .filter((channel: any) => channel.notificationTypes && channel.notificationTypes.includes(eventData.eventType));
    }
}


export const slackEventManager = new SlackEventManager();

export async function notifyDocumentView(data: Omit<SlackEventData, 'eventType'>) {
    await slackEventManager.processEvent({ ...data, eventType: 'document_view' });
}

export async function notifyDataroomAccess(data: Omit<SlackEventData, 'eventType'>) {
    await slackEventManager.processEvent({ ...data, eventType: 'dataroom_access' });
}


export async function notifyDocumentDownload(data: Omit<SlackEventData, 'eventType'>) {
    await slackEventManager.processEvent({ ...data, eventType: 'document_download' });
}

