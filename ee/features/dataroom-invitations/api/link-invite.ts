import { NextApiRequest, NextApiResponse } from "next";

import {
  SendLinkInvitationSchema,
  invitationEmailSchema,
} from "@/ee/features/dataroom-invitations/lib/schema/dataroom-invitations";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { LinkType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { getFeatureFlags } from "@/lib/featureFlags";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { constructLinkUrl } from "@/lib/utils/link-url";

import { sendDataroomViewerInvite } from "../emails/lib/send-dataroom-viewer-invite";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const user = session.user as CustomUser;
  const {
    teamId,
    id: dataroomId,
    linkId,
  } = req.query as {
    teamId: string;
    id: string;
    linkId: string;
  };

  const parseResult = SendLinkInvitationSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parseResult.error.flatten(),
    });
  }

  const { customMessage, emails } = parseResult.data;

  try {
    const teamAccess = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId,
        },
      },
    });

    if (!teamAccess) {
      return res.status(401).end("Unauthorized");
    }

    // Check if dataroomInvitations feature is enabled for this team
    const featureFlags = await getFeatureFlags({ teamId });
    if (!featureFlags.dataroomInvitations) {
      return res.status(403).json({
        error: "Dataroom invitations feature is not enabled for this team",
      });
    }

    const link = await prisma.link.findFirst({
      where: {
        id: linkId,
        dataroomId,
        teamId,
        linkType: LinkType.DATAROOM_LINK,
        isArchived: false,
      },
      select: {
        id: true,
        domainId: true,
        domainSlug: true,
        slug: true,
        allowList: true,
        dataroom: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    const teamMember = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    if (!teamMember?.email) {
      return res.status(400).json({ error: "Sender email not available" });
    }

    const defaultEmails = (link.allowList ?? []).filter(
      (value) => invitationEmailSchema.safeParse(value).success,
    );

    const targetEmails = Array.from(
      new Set(
        (emails ?? defaultEmails).filter(
          (email) => invitationEmailSchema.safeParse(email).success,
        ),
      ),
    );

    if (targetEmails.length === 0) {
      return res.status(400).json({
        error: "No valid recipient emails provided",
      });
    }

    await prisma.viewer.createMany({
      data: targetEmails.map((email) => ({
        email,
        teamId,
      })),
      skipDuplicates: true,
    });

    const viewers = await prisma.viewer.findMany({
      where: {
        teamId,
        email: {
          in: targetEmails,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const viewerByEmail = viewers.reduce<Record<string, { id: string }>>(
      (acc, viewer) => {
        if (viewer.email) {
          acc[viewer.email] = { id: viewer.id };
        }
        return acc;
      },
      {},
    );

    const linkUrl = constructLinkUrl(link);

    const successes: string[] = [];
    const failures: { email: string; error: string }[] = [];

    for (const email of targetEmails) {
      const viewer = viewerByEmail[email];
      if (!viewer) {
        failures.push({
          email,
          error: "Viewer not found",
        });
        continue;
      }

      try {
        await sendDataroomViewerInvite({
          dataroomName: link.dataroom?.name ?? "",
          senderEmail: teamMember.email,
          to: email,
          url: linkUrl,
          customMessage,
        });

        await prisma.viewerInvitation.create({
          data: {
            viewerId: viewer.id,
            linkId: link.id,
            invitedBy: user.id,
            customMessage,
            status: "SENT",
          },
        });

        successes.push(email);
      } catch (error: any) {
        failures.push({
          email,
          error: error?.message ?? "Unknown error",
        });

        await prisma.viewerInvitation.create({
          data: {
            viewerId: viewer.id,
            linkId: link.id,
            invitedBy: user.id,
            customMessage,
            status: "FAILED",
          },
        });
      }
    }

    return res.status(200).json({
      success: successes,
      failed: failures,
    });
  } catch (error) {
    console.error("Error sending link invitations", error);
    return res.status(500).json({
      error: "Failed to send invitations",
    });
  }
}
