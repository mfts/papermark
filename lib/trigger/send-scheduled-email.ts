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
      await sendDataroomTrialEndEmail({
        email: payload.to,
        name: payload.name,
      });
      logger.info("Email sent", { to: payload.to, teamId: payload.teamId });

      await prisma.team.update({
        where: {
          id: payload.teamId,
        },
        data: {
          plan: team.plan.replace("+drtrial", ""),
        },
      });
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
