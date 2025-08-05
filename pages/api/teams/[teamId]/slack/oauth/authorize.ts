import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { slackClient } from '@/lib/slack/client';
import { CustomUser } from '@/lib/types';
import prisma from '@/lib/prisma';

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

        const existingIntegration = await prisma.slackIntegration.findUnique({
            where: { teamId },
        });

        if (existingIntegration) {
            return res.status(400).json({
                error: 'Slack integration already exists for this team',
                integrationId: existingIntegration.id
            });
        }

        const state = Buffer.from(JSON.stringify({ teamId, userId })).toString('base64');

        const redirectUri = `${process.env.NEXTAUTH_URL}/api/slack/oauth/callback`;

        const oauthUrl = slackClient.getOAuthUrl(state, redirectUri);

        return res.status(200).json({
            oauthUrl,
            state
        });

    } catch (error) {
        console.error('Slack OAuth authorization error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 