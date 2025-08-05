import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { CustomUser } from '@/lib/types';
import prisma from '@/lib/prisma';
import { slackScheduleManager } from '@/lib/slack/schedule-manager';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;

    const userTeam = await prisma.userTeam.findUnique({
        where: {
            userId_teamId: {
                userId,
                teamId,
            },
        },
    });

    if (!userTeam) {
        return res.status(403).json({ error: 'Access denied' });
    }

    switch (req.method) {
        case 'GET':
            return handleGet(req, res, teamId);
        case 'PUT':
            return handleUpdate(req, res, teamId);
        case 'DELETE':
            return handleDelete(req, res, teamId);
        default:
            return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function handleGet(
    req: NextApiRequest,
    res: NextApiResponse,
    teamId: string
) {
    try {
        const integration = await prisma.slackIntegration.findUnique({
            where: { teamId },
            select: {
                id: true,
                workspaceId: true,
                workspaceName: true,
                workspaceUrl: true,
                botUserId: true,
                botUsername: true,
                enabled: true,
                notificationTypes: true,
                frequency: true,
                timezone: true,
                dailyTime: true,
                weeklyDay: true,
                defaultChannel: true,
                enabledChannels: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!integration) {
            return res.status(404).json({ error: 'Slack integration not found' });
        }

        return res.status(200).json(integration);
    } catch (error) {
        console.error('Error fetching Slack integration:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function handleUpdate(
    req: NextApiRequest,
    res: NextApiResponse,
    teamId: string
) {
    try {
        const {
            enabled,
            notificationTypes,
            frequency,
            timezone,
            dailyTime,
            weeklyDay,
            defaultChannel,
            enabledChannels,
        } = req.body;

        const integration = await prisma.slackIntegration.findUnique({
            where: { teamId },
        });

        if (!integration) {
            return res.status(404).json({ error: 'Slack integration not found' });
        }

        const updatedIntegration = await prisma.slackIntegration.update({
            where: { teamId },
            data: {
                enabled: enabled !== undefined ? enabled : integration.enabled,
                notificationTypes: notificationTypes || integration.notificationTypes,
                frequency: frequency || integration.frequency,
                timezone: timezone || integration.timezone,
                dailyTime: dailyTime !== undefined ? dailyTime : integration.dailyTime,
                weeklyDay: weeklyDay !== undefined ? weeklyDay : integration.weeklyDay,
                defaultChannel: defaultChannel !== undefined ? defaultChannel : integration.defaultChannel,
                enabledChannels: enabledChannels || integration.enabledChannels,
            },
            select: {
                id: true,
                workspaceId: true,
                workspaceName: true,
                workspaceUrl: true,
                botUserId: true,
                botUsername: true,
                enabled: true,
                notificationTypes: true,
                frequency: true,
                timezone: true,
                dailyTime: true,
                weeklyDay: true,
                defaultChannel: true,
                enabledChannels: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        try {
            await slackScheduleManager.createOrUpdateSchedule(updatedIntegration);
        } catch (scheduleError) {
            console.error('Error updating schedule for integration:', scheduleError);
        }

        return res.status(200).json(updatedIntegration);
    } catch (error) {
        console.error('Error updating Slack integration:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function handleDelete(
    req: NextApiRequest,
    res: NextApiResponse,
    teamId: string
) {
    try {
        const integration = await prisma.slackIntegration.findUnique({
            where: { teamId },
        });

        if (!integration) {
            return res.status(404).json({ error: 'Slack integration not found' });
        }

        try {
            await slackScheduleManager.deleteSchedule(integration.id);
        } catch (scheduleError) {
            console.error('Error deleting schedule for integration:', scheduleError);
        }

        await prisma.slackNotification.deleteMany({
            where: { slackIntegrationId: integration.id },
        });

        await prisma.slackIntegration.delete({
            where: { teamId },
        });

        return res.status(200).json({ message: 'Slack integration deleted successfully' });
    } catch (error) {
        console.error('Error deleting Slack integration:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 