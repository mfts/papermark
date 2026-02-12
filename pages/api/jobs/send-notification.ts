import { NextApiRequest, NextApiResponse } from "next";

import { isTeamPausedById } from "@/ee/features/billing/cancellation/lib/is-team-paused";

import { sendViewedDataroomEmail } from "@/lib/emails/send-viewed-dataroom";
import { sendViewedDataroomPausedEmail } from "@/lib/emails/send-viewed-dataroom-paused";
import { sendViewedDocumentEmail } from "@/lib/emails/send-viewed-document";
import { sendViewedDocumentPausedEmail } from "@/lib/emails/send-viewed-document-paused";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export const config = {
  maxDuration: 60,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  // Extract the API Key from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // Assuming the format is "Bearer [token]"

  // Check if the API Key matches
  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { viewId, locationData } = req.body as {
    viewId: string;
    locationData: {
      continent: string | null;
      country: string;
      region: string;
      city: string;
    };
  };

  let view: {
    viewType: "DOCUMENT_VIEW" | "DATAROOM_VIEW";
    viewerEmail: string | null;
    linkId: string;
    link: { name: string | null; ownerId: string | null } | null;
    document: {
      teamId: string | null;
      id: string;
      name: string;
      ownerId: string | null;
    } | null;
    dataroom: {
      teamId: string | null;
      id: string;
      name: string;
    } | null;
    team: {
      plan: string | null;
      ignoredDomains: string[] | null;
      pauseStartsAt: Date | null;
    } | null;
  } | null;

  try {
    // Fetch the view with data
    view = await prisma.view.findUnique({
      where: {
        id: viewId,
      },
      select: {
        viewType: true,
        viewerEmail: true,
        linkId: true,
        link: {
          select: {
            name: true,
            ownerId: true,
          },
        },
        document: {
          select: {
            teamId: true,
            id: true,
            name: true,
            ownerId: true,
          },
        },
        dataroom: {
          select: {
            teamId: true,
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            plan: true,
            ignoredDomains: true,
            pauseStartsAt: true,
          },
        },
      },
    });

    if (!view) {
      res.status(404).json({ message: "View not found." });
      return;
    }
  } catch (error) {
    log({
      message: `Failed to find document / dataroom view for viewId: ${viewId}. \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ message: (error as Error).message });
    return;
  }

  const teamId =
    view.viewType === "DOCUMENT_VIEW"
      ? view.document!.teamId!
      : view.dataroom!.teamId!;

  if (view.viewerEmail) {
    const viewerDomain = view.viewerEmail.split("@").pop();
    if (viewerDomain) {
      if (view?.team?.ignoredDomains) {
        const ignoredDomainList = view.team.ignoredDomains.map((d) =>
          d.startsWith("@") ? d.substring(1) : d,
        );

        if (ignoredDomainList.includes(viewerDomain)) {
          return res.status(200).json({
            message: "Notification skipped for ignored domain.",
            viewId,
          });
        }
      }
    }
  }

  // Get all active team members who are admins or managers to be notified
  const users = await prisma.userTeam.findMany({
    where: {
      role: { in: ["ADMIN", "MANAGER"] },
      status: "ACTIVE",
      teamId: teamId,
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

  // Fetch document owner and link owner emails in parallel (async-parallel best practice)
  const [ownerEmail, linkOwnerEmail] = await Promise.all([
    // Get the active owner of the document
    view.document?.ownerId
      ? prisma.userTeam
          .findUnique({
            where: {
              userId_teamId: {
                userId: view.document.ownerId,
                teamId: teamId,
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
          })
          .then((result) => result?.user.email || null)
      : null,
    // Get the active owner of the link
    view.link?.ownerId
      ? prisma.userTeam
          .findUnique({
            where: {
              userId_teamId: {
                userId: view.link.ownerId,
                teamId: teamId,
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
          })
          .then((result) => result?.user.email || null)
      : null,
  ]);

  const includeLocation =
    !view.team?.plan?.includes("free") &&
    !view.team?.plan?.includes("starter") &&
    !view.team?.plan?.includes("pro");

  const locationString =
    locationData.country === "US"
      ? `${locationData.city}, ${locationData.region}, ${locationData.country}`
      : `${locationData.city}, ${locationData.country}`;

  // POST /api/jobs/send-notification
  try {
    const adminEmail = users.find((user) => user.role === "ADMIN")?.user.email;

    // Guard: ensure we have an admin email to send notifications to
    if (!adminEmail) {
      log({
        message: `No admin email found for team when sending notification. \n\n*Metadata*: \`{teamId: ${teamId}, viewId: ${viewId}}\``,
        type: "error",
      });
      return res.status(400).json({ message: "No admin email found for team" });
    }

    // Check if team is paused
    const teamIsPaused = await isTeamPausedById(teamId);

    if (view.viewType === "DOCUMENT_VIEW") {
      const teamMembers = users
        .map((user) => user.user.email!)
        .filter((email) => email !== adminEmail);

      // Add ownerEmail to teamMembers if it exists and isn't already included
      if (
        ownerEmail &&
        ownerEmail !== adminEmail &&
        !teamMembers.includes(ownerEmail)
      ) {
        teamMembers.push(ownerEmail);
      }

      // Add linkOwnerEmail to teamMembers if it exists and isn't already included
      if (
        linkOwnerEmail &&
        linkOwnerEmail !== adminEmail &&
        linkOwnerEmail !== ownerEmail &&
        !teamMembers.includes(linkOwnerEmail)
      ) {
        teamMembers.push(linkOwnerEmail);
      }

      // send appropriate email based on team pause status
      if (teamIsPaused) {
        await sendViewedDocumentPausedEmail({
          ownerEmail: adminEmail,
          documentName: view.document!.name,
          linkName: view.link!.name || `Link #${view.linkId.slice(-5)}`,
          teamMembers,
        });
      } else {
        await sendViewedDocumentEmail({
          ownerEmail: adminEmail,
          documentId: view.document!.id,
          documentName: view.document!.name,
          linkName: view.link!.name || `Link #${view.linkId.slice(-5)}`,
          viewerEmail: view.viewerEmail,
          teamMembers,
          locationString: includeLocation ? locationString : undefined,
        });
      }
    } else {
      const teamMembers = users
        .map((user) => user.user.email!)
        .filter((email) => email !== adminEmail);

      // Add linkOwnerEmail to teamMembers if it exists and isn't already included
      if (
        linkOwnerEmail &&
        linkOwnerEmail !== adminEmail &&
        !teamMembers.includes(linkOwnerEmail)
      ) {
        teamMembers.push(linkOwnerEmail);
      }

      // send appropriate email based on team pause status
      if (teamIsPaused) {
        await sendViewedDataroomPausedEmail({
          ownerEmail: adminEmail,
          dataroomName: view.dataroom!.name,
          linkName: view.link!.name || `Link #${view.linkId.slice(-5)}`,
          teamMembers,
        });
      } else {
        await sendViewedDataroomEmail({
          ownerEmail: adminEmail,
          dataroomId: view.dataroom!.id,
          dataroomName: view.dataroom!.name,
          viewerEmail: view.viewerEmail,
          linkName: view.link!.name || `Link #${view.linkId.slice(-5)}`,
          teamMembers,
          locationString: includeLocation ? locationString : undefined,
        });
      }
    }

    res.status(200).json({ message: "Successfully sent notification", viewId });
    return;
  } catch (error) {
    log({
      message: `Failed to send email in _/api/views_ route for linkId: ${view.linkId}. \n\n Error: ${error} \n\n*Metadata*: \`{teamId: ${teamId}, viewId: ${viewId}}\``,
      type: "error",
      mention: true,
    });
    return res.status(500).json({ message: (error as Error).message });
  }
}
