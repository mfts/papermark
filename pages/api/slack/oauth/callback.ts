import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { slackClient } from '@/lib/slack/client';
import { CustomUser } from '@/lib/types';
import prisma from '@/lib/prisma';
import { slackScheduleManager } from '@/lib/slack/schedule-manager';

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
        console.log('req.query', req.query)
        const { code, state, error } = req.query as { code: string; state: string; error?: string };

        const userId = (session.user as CustomUser).id;

        // Handle OAuth errors
        if (error) {
            return res.redirect(`/settings/slack?error=${encodeURIComponent(error)}`);
        }

        if (!code || !state) {
            return res.redirect(`/settings/slack?error=${encodeURIComponent('Missing authorization code or state')}`);
        }

        // Decode state to get teamId and userId
        let stateData: { teamId: string; userId: string };
        try {
            stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        } catch (error) {
            return res.redirect(`/settings/slack?error=${encodeURIComponent('Invalid state parameter')}`);
        }

        const { teamId } = stateData;

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
            return res.redirect(`/settings/slack?error=${encodeURIComponent('Access denied')}`);
        }

        // Validate state parameter
        if (stateData.userId !== userId) {
            return res.redirect(`/settings/slack?error=${encodeURIComponent('Invalid state parameter')}`);
        }

        // Check if integration already exists
        const existingIntegration = await prisma.slackIntegration.findUnique({
            where: { teamId },
        });

        if (existingIntegration) {
            return res.redirect(`/settings/slack?error=${encodeURIComponent('Slack integration already exists for this team')}`);
        }

        // Exchange code for access token
        const redirectUri = `${process.env.NEXTAUTH_URL}/api/slack/oauth/callback`;
        const oauthResponse = await slackClient.exchangeCodeForToken(code, redirectUri);


        // Get workspace and bot information
        const workspaceInfo = await slackClient.getWorkspaceInfo(oauthResponse.access_token);
        const botInfo = await slackClient.getBotInfo(oauthResponse.access_token);

        // Create Slack integration
        const integration = await prisma.slackIntegration.create({
            data: {
                teamId,
                workspaceId: workspaceInfo.id,
                workspaceName: workspaceInfo.name,
                workspaceUrl: workspaceInfo.url,
                accessToken: oauthResponse.access_token,
                botUserId: botInfo.id,
                botUsername: botInfo.name,
                enabledChannels: {},
                notificationTypes: {
                    document_view: true,
                    dataroom_access: true,
                    document_download: true,
                    document_reaction: true,
                },
                enabled: true,
                frequency: 'instant',
                timezone: 'UTC',
                dailyTime: '10:00',
            },
        });

        try {
            await slackScheduleManager.createOrUpdateSchedule(integration);
        } catch (scheduleError) {
            console.error('Error creating schedule for new integration:', scheduleError);
        }

        // Redirect back to settings with success
        return res.redirect(`/settings/slack?success=true&integrationId=${integration.id}`);

    } catch (error) {
        console.error('Slack OAuth callback error:', error);
        return res.redirect(`/settings/slack?error=${encodeURIComponent('Failed to complete Slack integration')}`);
    }
} 