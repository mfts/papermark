import { deleteDomain } from "@/lib/api/domains";
import { limiter } from "@/lib/cron";
import { sendDeletedDomainEmail } from "@/lib/emails/send-deleted-domain";
import { sendInvalidDomainEmail } from "@/lib/emails/send-invalid-domain";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export const handleDomainUpdates = async ({
  domain,
  createdAt,
  verified,
  changed,
  linksCount,
}: {
  domain: string;
  createdAt: Date;
  verified: boolean;
  changed: boolean;
  linksCount: number;
}) => {
  if (changed) {
    await log({
      message: `Domain *${domain}* changed status to *${verified}*`,
      type: "cron",
    });
  }

  if (verified) return;

  const invalidDays = Math.floor(
    (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24),
  );

  // do nothing if domain is invalid for less than 14 days
  if (invalidDays != 1 && invalidDays < 14) return;

  const team = await prisma.team.findFirst({
    where: {
      domains: {
        some: {
          slug: domain,
        },
      },
    },
    select: {
      id: true,
      name: true,
      sentEmails: {
        where: {
          type: {
            in: [
              "FIRST_DAY_DOMAIN_REMINDER_EMAIL",
              "FIRST_DOMAIN_INVALID_EMAIL",
              "SECOND_DOMAIN_INVALID_EMAIL",
            ],
          },
        },
        select: {
          type: true,
          domainSlug: true,
        },
      },
      users: {
        where: { role: "ADMIN" },
        select: {
          user: {
            select: { email: true },
          },
        },
      },
    },
  });
  if (!team) {
    await log({
      message: `Domain *${domain}* is invalid but not associated with any user, skipping.`,
      type: "cron",
      mention: true,
    });
    return;
  }

  // create an array of tuples with email type and domain slug
  const sentEmails = team.sentEmails.map((email) => [
    email.type,
    email.domainSlug,
  ]);
  const userEmail = team.users[0].user.email!;

  // if domain is invalid for more than 30 days, check if we can delete it
  if (invalidDays >= 30) {
    // if there are still links associated with the domain,
    // and those links have views associated with them,
    // don't delete the domain (manual inspection required)
    if (linksCount > 0) {
      const linksViews = await prisma.link.findMany({
        where: {
          domainSlug: domain,
        },
        select: {
          _count: {
            select: {
              views: true,
            },
          },
        },
      });

      const totalLinksViews = linksViews.reduce(
        (acc, link) => acc + link._count.views,
        0,
      );

      if (totalLinksViews > 0) {
        await log({
          message: `Domain *${domain}* has been invalid for > 30 days and has links with clicks, skipping.`,
          type: "cron",
          mention: true,
        });
        return;
      }
    }
    // else, delete the domain and send email
    return await Promise.allSettled([
      deleteDomain(domain),
      log({
        message: `Domain *${domain}* has been invalid for > 30 days and ${
          linksCount > 0 ? "has links but no link clicks" : "has no links"
        }, deleting.`,
        type: "cron",
        mention: true,
      }),
      limiter.schedule(() => sendDeletedDomainEmail(userEmail, domain)),
    ]);
  }

  // if domain is invalid for more than 28 days, send email
  if (invalidDays >= 28) {
    const sentSecondDomainInvalidEmail = sentEmails.some(
      ([type, domainSlug]) =>
        type === "SECOND_DOMAIN_INVALID_EMAIL" && domainSlug === domain,
    );
    if (!sentSecondDomainInvalidEmail) {
      return await Promise.allSettled([
        log({
          message: `Domain *${domain}* is invalid for ${invalidDays} days, email sent.`,
          type: "cron",
        }),
        limiter.schedule(() =>
          sendInvalidDomainEmail(userEmail, domain, invalidDays),
        ),
        prisma.sentEmail.create({
          data: {
            type: "SECOND_DOMAIN_INVALID_EMAIL",
            teamId: team.id,
            recipient: userEmail,
            domainSlug: domain,
          },
        }),
      ]);
    }
  }

  // if domain is invalid for more than 14 days, send email
  if (invalidDays >= 14) {
    const sentFirstDomainInvalidEmail = sentEmails.some(
      ([type, domainSlug]) =>
        type === "FIRST_DOMAIN_INVALID_EMAIL" && domainSlug === domain,
    );
    if (!sentFirstDomainInvalidEmail) {
      return await Promise.allSettled([
        log({
          message: `Domain *${domain}* is invalid for ${invalidDays} days, email sent.`,
          type: "cron",
        }),
        limiter.schedule(() =>
          sendInvalidDomainEmail(userEmail, domain, invalidDays),
        ),
        prisma.sentEmail.create({
          data: {
            type: "FIRST_DOMAIN_INVALID_EMAIL",
            teamId: team.id,
            recipient: userEmail,
            domainSlug: domain,
          },
        }),
      ]);
    }
  }

  // if domain is invalid after the first day, send email
  if (invalidDays == 1) {
    const sentFirstDayDomainReminderEmail = sentEmails.some(
      ([type, domainSlug]) =>
        type === "FIRST_DAY_DOMAIN_REMINDER_EMAIL" && domainSlug === domain,
    );
    if (!sentFirstDayDomainReminderEmail) {
      return await Promise.allSettled([
        log({
          message: `Domain *${domain}* is invalid for ${invalidDays} days, email sent.`,
          type: "cron",
        }),
        limiter.schedule(() =>
          sendInvalidDomainEmail(userEmail, domain, invalidDays),
        ),
        prisma.sentEmail.create({
          data: {
            type: "FIRST_DAY_DOMAIN_REMINDER_EMAIL",
            teamId: team.id,
            recipient: userEmail,
            domainSlug: domain,
          },
        }),
      ]);
    }
  }

  return;
};
