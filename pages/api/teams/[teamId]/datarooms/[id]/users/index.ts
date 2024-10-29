import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { sendViewerInvitation } from "@/lib/api/notification-helper";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/users
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauhorized");
    }

    // INFO: This endpoint is not available anymore
    return res.status(404).json("Not available");

    // const { teamId, id: dataroomId } = req.query as {
    //   teamId: string;
    //   id: string;
    // };

    // const { emails } = req.body as { emails: string[] };

    // if (!emails) {
    //   return res.status(400).json("Email is missing in request body");
    // }

    // if (emails.length > 5) {
    //   return res
    //     .status(400)
    //     .json("You can only send invitations to 5 emails at a time.");
    // }

    // try {
    //   const team = await prisma.team.findUnique({
    //     where: {
    //       id: teamId,
    //       plan: {
    //         notIn: ["free", "free+drtrial"],
    //       },
    //       users: {
    //         some: {
    //           userId: (session.user as CustomUser).id,
    //         },
    //       },
    //     },
    //     select: {
    //       id: true,
    //     },
    //   });

    //   if (!team) {
    //     return res.status(403).end("Unauthorized to access this team");
    //   }

    //   const dataroom = await prisma.dataroom.findUnique({
    //     where: {
    //       id: dataroomId,
    //       teamId: teamId,
    //     },
    //     include: {
    //       viewers: true,
    //     },
    //   });

    //   if (!dataroom) {
    //     return res.status(404).end("Dataroom not found");
    //   }

    //   await prisma.viewer.createMany({
    //     data: emails.map((email) => ({
    //       email,
    //       dataroomId,
    //       teamId,
    //       invitedAt: new Date(),
    //     })),
    //     skipDuplicates: true,
    //   });

    //   const viewers = await prisma.viewer.findMany({
    //     where: {
    //       dataroomId,
    //       email: {
    //         in: emails,
    //       },
    //     },
    //     select: {
    //       id: true,
    //       email: true,
    //     },
    //   });

    //   // create a new link for the invited group
    //   const link = await prisma.link.create({
    //     data: {
    //       dataroomId,
    //       linkType: "DATAROOM_LINK",
    //       name: `Invited ${new Date().toLocaleString()}`,
    //       enableFeedback: false,
    //       teamId,
    //     },
    //     select: {
    //       id: true,
    //     },
    //   });

    //   console.time("sendemail");
    //   await sendViewerInvitation({
    //     dataroomId,
    //     linkId: link.id,
    //     viewerIds: viewers.map((v) => v.id),
    //     senderUserId: (session.user as CustomUser).id,
    //   });
    //   console.timeEnd("sendemail");

    //   return res.status(200).json("Invitation sent!");
    // } catch (error) {
    //   errorhandler(error, res);
    // }
  }
}
