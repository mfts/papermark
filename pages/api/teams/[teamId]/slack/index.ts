import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { CustomUser } from '@/lib/types';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const slackIntegrationUpdateSchema = z.object({
    enabled: z.boolean().optional(),
    defaultChannel: z.string().nullable().optional(),
    enabledChannels: z.record(z.string(), z.boolean()).optional(),
    notificationTypes: z.object({
        document_view: z.boolean().optional(),
        document_download: z.boolean().optional(),
        dataroom_access: z.boolean().optional(),
        document_comment: z.boolean().optional(),
        document_reaction: z.boolean().optional(),
    }).optional(),
});

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
        const validationResult = slackIntegrationUpdateSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Invalid request payload',
                details: validationResult.error.errors
            });
        }

        const {
            enabled,
            notificationTypes,
            defaultChannel,
            enabledChannels,
        } = validationResult.data;

        if (enabledChannels && Object.keys(validationResult.data).length === 1) {
            await prisma.slackIntegration.update({
                where: { teamId },
                data: { enabledChannels },
            });

            return res.status(200).json({
                success: true,
                enabledChannels,
                updatedAt: new Date().toISOString()
            });
        }

        const updateData: {
            enabled?: boolean;
            notificationTypes?: {
                document_view?: boolean;
                document_download?: boolean;
                dataroom_access?: boolean;
                document_comment?: boolean;
                document_reaction?: boolean;
            };
            defaultChannel?: string | null;
            enabledChannels?: Record<string, boolean>;
        } = {};

        if (enabled !== undefined) updateData.enabled = enabled;
        if (notificationTypes) updateData.notificationTypes = notificationTypes;
        if (defaultChannel !== undefined) updateData.defaultChannel = defaultChannel;
        if (enabledChannels) updateData.enabledChannels = enabledChannels;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updatedIntegration = await prisma.slackIntegration.update({
            where: { teamId },
            data: updateData,
            select: {
                id: true,
                workspaceId: true,
                workspaceName: true,
                workspaceUrl: true,
                botUserId: true,
                botUsername: true,
                enabled: true,
                notificationTypes: true,
                defaultChannel: true,
                enabledChannels: true,
                createdAt: true,
                updatedAt: true,
            },
        });



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

        await prisma.slackIntegration.delete({
            where: { teamId },
        });

        return res.status(200).json({ message: 'Slack integration deleted successfully' });
    } catch (error) {
        console.error('Error deleting Slack integration:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 