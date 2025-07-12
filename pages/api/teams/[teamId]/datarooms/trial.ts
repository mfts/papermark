import { NextApiResponse } from "next";

import { waitUntil } from "@vercel/functions";

import { sendDataroomTrialWelcome } from "@/lib/emails/send-dataroom-trial";
import { newId } from "@/lib/id-helper";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import {
  sendDataroomTrialExpiredEmailTask,
  sendDataroomTrialInfoEmailTask,
} from "@/lib/trigger/send-scheduled-email";
import { log } from "@/lib/utils";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/datarooms/trial
    const email = req.user.email;
    const { name, fullName, companyName, useCase, companySize, tools } =
      req.body as {
        name: string;
        fullName: string;
        companyName: string;
        useCase: string;
        companySize: string;
        tools: string;
      };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: req.team!.id,
        },
        select: {
          id: true,
          plan: true,
          _count: {
            select: {
              datarooms: true,
            },
          },
        },
      });

      if (!team) {
        res.status(401).end("Unauthorized");
        return;
      }

      if (team.plan.includes("drtrial") || team._count.datarooms > 0) {
        res.status(400).json({ message: "Trial data room already exists" });
        return;
      }

      await log({
        message: `Dataroom Trial: ${req.team!.id} \n\nEmail: ${email} \nName: ${fullName} \nCompany Name: ${companyName} \nUse Case: ${useCase} \nCompany Size: ${companySize} \nTools: ${tools}`,
        type: "trial",
        mention: true,
      });

      await prisma.team.update({
        where: { id: req.team!.id },
        data: {
          plan: `${team.plan}+drtrial`,
        },
      });

      const pId = newId("dataroom");

      const dataroom = await prisma.dataroom.create({
        data: {
          name: name,
          teamId: req.team!.id,
          pId: pId,
        },
      });

      const dataroomWithCount = {
        ...dataroom,
        _count: { documents: 0 },
      };

      /** Emails
       *
       * 1. Send welcome email
       * 2. Send dataroom info email after 1 day
       * 3. Send expired trial email after 7 days
       */
      waitUntil(sendDataroomTrialWelcome({ fullName, to: email! }));
      waitUntil(
        sendDataroomTrialInfoEmailTask.trigger(
          { to: email! },
          { delay: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
        ),
      );
      waitUntil(
        sendDataroomTrialExpiredEmailTask.trigger(
          { to: email!, name: fullName.split(" ")[0], teamId: req.team!.id },
          { delay: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        ),
      );

      res.status(201).json(dataroomWithCount);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error creating dataroom" });
    }
  },
});
