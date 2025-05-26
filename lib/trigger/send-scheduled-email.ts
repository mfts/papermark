import { logger, task } from "@trigger.dev/sdk/v3";

import { sendDataroomInfoEmail } from "@/lib/emails/send-dataroom-info";
import prisma from "@/lib/prisma";

import { sendDataroomTrialEndEmail } from "../emails/send-dataroom-trial-end";

export const sendDataroomTrialInfoEmailTask = task({
  id: "send-dataroom-trial-info-email",
  retry: { maxAttempts: 3 },
  run: async (payload: { to: string }) => {
    await sendDataroomInfoEmail({ user: { email: payload.to, name: "Marc" } });
    logger.info("Email sent", { to: payload.to });
  },
});

export const sendDataroomTrialExpiredEmailTask = task({
  id: "send-dataroom-trial-expired-email",
  retry: { maxAttempts: 3 },
  run: async (payload: { to: string; name: string; teamId: string }) => {
    const team = await prisma.team.findUnique({
      where: {
        id: payload.teamId,
      },
      select: {
        plan: true,
      },
    });

    if (!team) {
      logger.error("Team not found", { teamId: payload.teamId });
      return;
    }

    if (team.plan.includes("drtrial")) {
      // send email to the user
      await sendDataroomTrialEndEmail({
        email: payload.to,
        name: payload.name,
      });
      logger.info("Email sent", { to: payload.to, teamId: payload.teamId });

      // remove trial on the plan
      const updatedTeam = await prisma.team.update({
        where: { id: payload.teamId },
        data: { plan: team.plan.replace("+drtrial", "") },
      });

      const isPaid = [
        "pro",
        "business",
        "datarooms",
        "datarooms-plus",
      ].includes(updatedTeam.plan);

      if (!isPaid) {
        // remove branding
        await prisma.brand.deleteMany({
          where: {
            teamId: payload.teamId,
          },
        });
        logger.info("Branding removed after trial expired", {
          teamId: payload.teamId,
        });

        // block all non-admin users
        const blockedUsers = await prisma.userTeam.updateMany({
          where: {
            teamId: payload.teamId,
            role: { not: "ADMIN" },
          },
          data: {
            status: "BLOCKED_TRIAL_EXPIRED",
            blockedAt: new Date(),
          },
        });
        logger.info("Team members blocked after trial expired", {
          teamId: payload.teamId,
          usersCount: blockedUsers.count,
        });
      }

      logger.info("Trial removed", { teamId: payload.teamId });
      return;
    }

    logger.info("Team upgraded - no further action", {
      teamId: payload.teamId,
      plan: team.plan,
    });
    return;
  },
});
