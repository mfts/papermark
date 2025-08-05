import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { CustomUser } from '@/lib/types';
import prisma from '@/lib/prisma';
import { slackClient } from '@/lib/slack/client';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
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

        const integration = await prisma.slackIntegration.findUnique({
            where: { teamId },
        });

        if (!integration) {
            return res.status(404).json({ error: 'Slack integration not found' });
        }

        try {
            const channels = await slackClient.getChannels(integration.accessToken);

            const availableChannels = channels
                .filter(channel => !channel.is_archived)
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    is_private: channel.is_private,
                    is_member: channel.is_member || false,
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return res.status(200).json({ channels: availableChannels });
        } catch (slackError) {
            if (slackError instanceof Error && slackError.message.includes('missing_scope')) {
                return res.status(403).json({
                    error: 'Insufficient permissions. The Slack app needs channels:read permission.'
                });
            }

            if (slackError instanceof Error && slackError.message.includes('invalid_auth')) {
                return res.status(401).json({
                    error: 'Invalid Slack access token. Please reconnect your Slack integration.'
                });
            }
            return res.status(200).json({ channels: [] });
        }

    } catch (error) {
        console.error('Error fetching Slack channels:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 