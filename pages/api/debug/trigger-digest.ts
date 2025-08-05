import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { CustomUser } from '@/lib/types';
import prisma from '@/lib/prisma';
import { processSlackDigests } from '@/lib/slack/digest-processor';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };

    if (!teamId || typeof teamId !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing teamId parameter' });
    }

    try {
        // Verify user has access to team
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


        const integration = await prisma.slackIntegration.findUnique({
            where: { teamId },
        });

        if (!integration) {
            return res.status(404).json({ error: 'Slack integration not found' });
        }

        const pendingBefore = await prisma.slackNotification.count({
            where: {
                slackIntegrationId: integration.id,
                status: 'PENDING',
            },
        });

        await processSlackDigests(integration.id);

        const pendingAfter = await prisma.slackNotification.count({
            where: {
                slackIntegrationId: integration.id,
                status: 'PENDING',
            },
        });

        // Get processed notifications
        const processedNotifications = await prisma.slackNotification.findMany({
            where: {
                slackIntegrationId: integration.id,
                status: {
                    in: ['PROCESSED', 'FAILED'],
                },
                processedAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
                },
            },
            orderBy: {
                processedAt: 'desc',
            },
        });

        return res.status(200).json({
            success: true,
            integrationId: integration.id,
            pendingBefore,
            pendingAfter,
            processedCount: pendingBefore - pendingAfter,
            processedNotifications: processedNotifications.map(n => ({
                id: n.id,
                eventType: n.eventType,
                status: n.status,
                processedAt: n.processedAt,
                errorMessage: n.errorMessage,
            })),
            message: `Digest processing completed. Processed ${pendingBefore - pendingAfter} notifications.`
        });

    } catch (error) {
        console.error('Manual trigger error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
} 