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

    if (req.method !== 'GET' && req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userId = (session.user as CustomUser).id;

    if (req.method === 'GET') {
        try {
            const allSchedules = await slackScheduleManager.listSchedules();

            const schedulesWithTeamInfo = await Promise.all(
                allSchedules.map(async (schedule) => {
                    try {
                        const integration = await prisma.slackIntegration.findUnique({
                            where: { id: schedule.externalId },
                            include: {
                                team: {
                                    include: {
                                        users: {
                                            where: { userId },
                                            select: { role: true }
                                        }
                                    }
                                }
                            }
                        });

                        return {
                            scheduleId: schedule.id,
                            externalId: schedule.externalId,
                            cron: schedule.generator.expression,
                            timezone: schedule.timezone,
                            active: schedule.active,
                            team: integration?.team ? {
                                id: integration.team.id,
                                name: integration.team.name,
                                hasAccess: integration.team.users.length > 0
                            } : null,
                            integration: integration ? {
                                id: integration.id,
                                enabled: integration.enabled,
                                frequency: integration.frequency,
                                workspaceName: integration.workspaceName
                            } : null,
                            isOrphaned: !integration
                        };
                    } catch (error) {
                        return {
                            scheduleId: schedule.id,
                            externalId: schedule.externalId,
                            cron: schedule.generator.expression,
                            timezone: schedule.timezone,
                            active: schedule.active,
                            team: null,
                            integration: null,
                            isOrphaned: true,
                            error: 'Failed to fetch integration details'
                        };
                    }
                })
            );

            return res.status(200).json({
                schedules: schedulesWithTeamInfo,
                summary: {
                    total: schedulesWithTeamInfo.length,
                    active: schedulesWithTeamInfo.filter(s => s.active).length,
                    orphaned: schedulesWithTeamInfo.filter(s => s.isOrphaned).length,
                    accessible: schedulesWithTeamInfo.filter(s => s.team?.hasAccess).length
                }
            });
        } catch (error) {
            console.error('Error fetching schedules:', error);
            return res.status(500).json({ error: 'Failed to fetch schedules' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const allSchedules = await slackScheduleManager.listSchedules();
            const orphanedSchedules = [];

            for (const schedule of allSchedules) {
                try {
                    const integration = await prisma.slackIntegration.findUnique({
                        where: { id: schedule.externalId }
                    });

                    if (!integration) {
                        orphanedSchedules.push(schedule);
                    }
                } catch (error) {
                    orphanedSchedules.push(schedule);
                }
            }

            const deletedSchedules = [];
            for (const schedule of orphanedSchedules) {
                try {
                    await slackScheduleManager.deleteSchedule(schedule.externalId);
                    deletedSchedules.push(schedule.id);
                } catch (error) {
                    console.error(`Failed to delete orphaned schedule ${schedule.id}:`, error);
                }
            }

            return res.status(200).json({
                message: `Cleaned up ${deletedSchedules.length} orphaned schedules`,
                deletedSchedules,
                totalOrphaned: orphanedSchedules.length
            });
        } catch (error) {
            console.error('Error cleaning up orphaned schedules:', error);
            return res.status(500).json({ error: 'Failed to clean up orphaned schedules' });
        }
    }
} 