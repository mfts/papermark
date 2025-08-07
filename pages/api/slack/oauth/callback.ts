import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { slackClient } from '@/lib/slack/client';
import { CustomUser } from '@/lib/types';
import prisma from '@/lib/prisma';
import { slackScheduleManager } from '@/lib/slack/schedule-manager';
import { encryptSlackToken } from '@/lib/utils';
import { sendSlackIntegrationNotification } from '@/lib/emails/send-slack-integration-notification';

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
                accessToken: encryptSlackToken(oauthResponse.access_token),
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
            const team = await prisma.team.findUnique({
                where: { id: teamId },
                include: {
                    users: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            if (!team) {
                console.warn(`Team with id ${teamId} not found.`);
                return;
            }

            if (!team.users.length) {
                console.warn(`Team "${team.name}" has no users to notify.`);
                return;
            }

            const settingsUrl = `${process.env.NEXTAUTH_URL}/settings/slack`;

            const usersWithEmail = team.users.filter(userTeam => userTeam.user.email);

            const emailPromises = usersWithEmail.map(async (userTeam) => {
                try {
                    await sendSlackIntegrationNotification({
                        userEmail: userTeam.user.email!,
                        teamName: team.name,
                        settingsUrl,
                    });
                } catch (emailError) {
                    console.error(`Failed to send Slack integration notification email to ${userTeam.user.email}:`, emailError);
                }
            });

            await Promise.allSettled(emailPromises)
                .then(results => {
                    const rejected = results.filter(r => r.status === 'rejected');
                    if (rejected.length) {
                        console.error('Some Slack integration notification emails failed:', rejected);
                    }
                });
        } catch (err) {
            console.error('Unexpected error sending Slack integration notification emails:', err);
        }


        let scheduleWarning = false;
        try {
            await slackScheduleManager.createOrUpdateSchedule(integration);
        } catch (scheduleError) {
            console.error('Error creating schedule for new integration:', scheduleError);
            scheduleWarning = true;
        }
        const redirectParams = new URLSearchParams({
            success: 'true',
            integrationId: integration.id,
        });

        if (scheduleWarning) {
            redirectParams.append('warning', 'Schedule creation failed.');
        }

        return res.redirect(`/settings/slack?${redirectParams.toString()}`);

    } catch (error) {
        console.error('Slack OAuth callback error:', error);
        return res.redirect(`/settings/slack?error=${encodeURIComponent('Failed to complete Slack integration')}`);
    }
} 