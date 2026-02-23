import { logger, task } from "@trigger.dev/sdk/v3";

import prisma from "@/lib/prisma";

type UploadNotificationPayload = {
  dataroomId: string;
  linkId: string;
  viewerId: string;
  teamId: string;
};

export const sendDataroomUploadNotificationTask = task({
  id: "send-dataroom-upload-notification",
  retry: { maxAttempts: 3 },
  run: async (payload: UploadNotificationPayload) => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Get all recent uploads for this dataroom via this link by this viewer
    const recentUploads = await prisma.documentUpload.findMany({
      where: {
        dataroomId: payload.dataroomId,
        linkId: payload.linkId,
        viewerId: payload.viewerId,
        uploadedAt: {
          gte: tenMinutesAgo,
        },
      },
      select: {
        originalFilename: true,
        viewer: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    if (!recentUploads || recentUploads.length === 0) {
      logger.info("No recent uploads found for this dataroom link", {
        dataroomId: payload.dataroomId,
        linkId: payload.linkId,
      });
      return;
    }

    // Get dataroom and link info
    const [dataroom, link] = await Promise.all([
      prisma.dataroom.findUnique({
        where: { id: payload.dataroomId },
        select: { name: true, teamId: true },
      }),
      prisma.link.findUnique({
        where: { id: payload.linkId },
        select: { name: true, ownerId: true },
      }),
    ]);

    if (!dataroom) {
      logger.error("Dataroom not found", {
        dataroomId: payload.dataroomId,
      });
      return;
    }

    // Get all active team members who are admins or managers
    const users = await prisma.userTeam.findMany({
      where: {
        role: { in: ["ADMIN", "MANAGER"] },
        status: "ACTIVE",
        teamId: payload.teamId,
      },
      select: {
        role: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    const adminEmail = users.find((user) => user.role === "ADMIN")?.user.email;

    if (!adminEmail) {
      logger.error("No admin email found for team", {
        teamId: payload.teamId,
      });
      return;
    }

    // Build team members list (excluding admin to avoid duplicate)
    const teamMembers = users
      .map((user) => user.user.email!)
      .filter((email) => email !== adminEmail);

    // Add link owner to team members if they exist and aren't already included
    if (link?.ownerId) {
      const linkOwner = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: link.ownerId,
            teamId: payload.teamId,
          },
          status: "ACTIVE",
        },
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (
        linkOwner?.user.email &&
        linkOwner.user.email !== adminEmail &&
        !teamMembers.includes(linkOwner.user.email)
      ) {
        teamMembers.push(linkOwner.user.email);
      }
    }

    const documentNames = recentUploads.map(
      (upload) => upload.originalFilename || "Untitled document",
    );

    // Use the viewer's email from the uploads
    const uploaderEmail = recentUploads[0]?.viewer?.email || null;

    const linkName = link?.name || `Link #${payload.linkId.slice(-5)}`;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-dataroom-upload-notification`,
        {
          method: "POST",
          body: JSON.stringify({
            dataroomId: payload.dataroomId,
            dataroomName: dataroom.name,
            uploaderEmail,
            documentNames,
            linkName,
            ownerEmail: adminEmail,
            teamMembers,
            teamId: payload.teamId,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
          },
        },
      );

      if (!response.ok) {
        logger.error("Failed to send dataroom upload notification", {
          dataroomId: payload.dataroomId,
          linkId: payload.linkId,
          error: await response.text(),
        });
        return;
      }

      const { message } = (await response.json()) as { message: string };
      logger.info("Upload notification sent successfully", {
        dataroomId: payload.dataroomId,
        linkId: payload.linkId,
        message,
        uploadCount: recentUploads.length,
      });
    } catch (error) {
      logger.error("Error sending upload notification", {
        dataroomId: payload.dataroomId,
        linkId: payload.linkId,
        error,
      });
    }
  },
});
