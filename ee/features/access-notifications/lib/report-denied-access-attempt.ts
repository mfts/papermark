import { Link } from "@prisma/client";

import prisma from "@/lib/prisma";

import { sendBlockedEmailAttemptNotification } from "./send-blocked-email-attempt";

export async function reportDeniedAccessAttempt(
  link: Partial<Link>,
  email: string,
  accessType: "global" | "allow" | "deny" = "global",
) {
  if (!link || !link.teamId) return;

  // Get all admin and manager emails
  const users = await prisma.userTeam.findMany({
    where: {
      role: { in: ["ADMIN", "MANAGER"] },
      status: "ACTIVE",
      teamId: link.teamId,
    },
    select: {
      user: { select: { email: true } },
    },
  });

  const adminManagerEmails = users
    .map((u) => u.user?.email)
    .filter((e): e is string => !!e);

  // Get resource info and owner email
  let resourceType: "dataroom" | "document" = "dataroom";
  let resourceName = "Dataroom";
  let ownerEmail: string | undefined;

  if (link.documentId) {
    resourceType = "document";
    const document = await prisma.document.findUnique({
      where: { id: link.documentId },
      select: { name: true, ownerId: true },
    });
    resourceName = document?.name || "Document";

    if (document?.ownerId) {
      const owner = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: document.ownerId,
            teamId: link.teamId,
          },
          status: "ACTIVE",
        },
        select: { user: { select: { email: true } } },
      });
      ownerEmail = owner?.user?.email || undefined;
    }
  } else if (link.dataroomId) {
    const dataroom = await prisma.dataroom.findUnique({
      where: { id: link.dataroomId },
      select: { name: true },
    });
    resourceName = dataroom?.name || "Dataroom";
  }

  // Combine all recipients and remove duplicates
  const allRecipients = [...adminManagerEmails];
  if (ownerEmail && !allRecipients.includes(ownerEmail)) {
    allRecipients.push(ownerEmail);
  }

  // Send email to all recipients
  if (allRecipients.length > 0) {
    const [to, ...cc] = allRecipients;
    await sendBlockedEmailAttemptNotification({
      to,
      cc: cc.length > 0 ? cc : undefined,
      blockedEmail: email,
      linkName: link.name || `Link #${link.id?.slice(-5)}`,
      resourceName,
      resourceType,
      timestamp: new Date().toLocaleString(),
      accessType,
    });
  }
}
