import { schedules } from "@trigger.dev/sdk/v3";
import { processSlackDigestJob } from "@/lib/trigger/slack-digest";
import prisma from "@/lib/prisma";

export class SlackScheduleManager {
    /**
     * Create or update a schedule for a Slack integration
     */
    async createOrUpdateSchedule(integration: any): Promise<void> {
        try {
            await this.deleteSchedule(integration.id);

            if (integration.frequency === 'instant') {
                await this.cleanupOldNotifications(integration.id);
                return;
            }

            const cronPattern = this.generateCronPattern(integration);
            const timezone = integration.timezone || 'UTC';

            console.log(`Creating schedule for integration ${integration.id}:`, {
                cron: cronPattern,
                timezone: timezone,
                frequency: integration.frequency
            });

            await schedules.create({
                task: processSlackDigestJob.id,
                cron: cronPattern,
                timezone: timezone,
                externalId: integration.id,
                deduplicationKey: `slack-integration-${integration.id}`,
            });

            console.log(`Successfully created schedule for integration ${integration.id}`);

        } catch (error) {
            console.error(`Error creating schedule for integration ${integration.id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a schedule for a Slack integration
     */
    async deleteSchedule(integrationId: string): Promise<void> {
        try {
            const allSchedules = await schedules.list();
            const schedulesList = allSchedules.data || [];
            const integrationSchedule = schedulesList.find(
                (schedule: any) => schedule.externalId === integrationId
            );

            if (integrationSchedule) {
                await schedules.del(integrationSchedule.id);
                console.log(`Deleted schedule for integration ${integrationId}`);
            } else {
                console.log(`No schedule found for integration ${integrationId}`);
            }

        } catch (error) {
            console.error(`Error deleting schedule for integration ${integrationId}:`, error);
        }
    }

    /**
     * Clean up old notifications when switching from instant to digest
     */
    async cleanupOldNotifications(integrationId: string): Promise<void> {
        try {
            await prisma.slackNotification.deleteMany({
                where: {
                    slackIntegrationId: integrationId,
                    status: 'PENDING',
                },
            });
            console.log(`Cleaned up old notifications for integration ${integrationId}`);
        } catch (error) {
            console.error(`Error cleaning up old notifications for integration ${integrationId}:`, error);
        }
    }


    private generateCronPattern(integration: any): string {
        const time = integration.dailyTime || '10:00';
        const [hours, minutes] = time.split(':').map(Number);

        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            console.warn(`Invalid time format: ${time}, using default 10:00`);
            return `0 10 * * *`;
        }

        switch (integration.frequency) {
            case 'daily':
                return `${minutes} ${hours} * * *`;

            case 'weekly':
                const weeklyDay = integration.weeklyDay || 'monday';
                const dayMap: Record<string, number> = {
                    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
                    'thursday': 4, 'friday': 5, 'saturday': 6
                };
                const dayOfWeek = dayMap[weeklyDay.toLowerCase()];

                if (dayOfWeek === undefined) {
                    console.warn(`Invalid day: ${weeklyDay}, using Monday`);
                    return `${minutes} ${hours} * * 1`;
                }

                return `${minutes} ${hours} * * ${dayOfWeek}`;

            default:
                return `0 10 * * *`;
        }
    }

    async listSchedules(): Promise<any[]> {
        try {
            const allSchedules = await schedules.list();
            const schedulesList = allSchedules.data || [];
            return schedulesList.filter((schedule: any) =>
                schedule.externalId && schedule.task === processSlackDigestJob.id
            );
        } catch (error) {
            console.error('Error listing schedules:', error);
            return [];
        }
    }


    async cleanupTeamSchedules(teamId: string): Promise<void> {
        try {
            const integrations = await prisma.slackIntegration.findMany({
                where: { teamId },
                select: { id: true },
            });
            for (const integration of integrations) {
                try {
                    await this.deleteSchedule(integration.id);
                } catch (error) {
                    console.error(`Error deleting schedule for integration ${integration.id}:`, error)
                }
            }
        } catch (error) {
            console.error(`Error cleaning up schedules for team ${teamId}:`, error);
            throw error;
        }
    }
}

export const slackScheduleManager = new SlackScheduleManager(); 