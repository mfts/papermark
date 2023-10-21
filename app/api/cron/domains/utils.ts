import { log } from "@/lib/utils";
import { deleteDomain } from "@/lib/api/domains";
import prisma from "@/lib/prisma";
import { limiter } from "@/lib/cron";
import { sendDeletedDomainEmail } from "@/lib/emails/send-deleted-domain";
import { sendInvalidDomainEmail } from "@/lib/emails/send-invalid-domain";

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
    await log(`Domain *${domain}* changed status to *${verified}*`, verified);
  }

  if (verified) return;

  const invalidDays = Math.floor(
    (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24)
  );

  // do nothing if domain is invalid for less than 14 days
  if (invalidDays != 1 && invalidDays < 14) return;

  const user = await prisma.user.findFirst({
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
      email: true,
    },
  });
  if (!user) {
    await log(
      `Domain *${domain}* is invalid but not associated with any user, skipping.`,
      true
    );
    return;
  }

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
        0
      );

      if (totalLinksViews > 0) {
        return await log(
          `Domain *${domain}* has been invalid for > 30 days and has links with clicks, skipping.`
        );
      }
    }
    // else, delete the domain and send email
    return await Promise.allSettled([
      deleteDomain(domain),
      log(
        `Domain *${domain}* has been invalid for > 30 days and ${
          linksCount > 0 ? "has links but no link clicks" : "has no links"
        }, deleting.`
      ),
      limiter.schedule(() => sendDeletedDomainEmail(user.email!, domain)),
    ]);
  }

  // if domain is invalid for more than 28 days, send email
  if (invalidDays == 28) {
    return await Promise.allSettled([
      log(`Domain *${domain}* is invalid for ${invalidDays} days, email sent.`),
      limiter.schedule(() =>
        sendInvalidDomainEmail(user.email!, domain, invalidDays)
      ),
    ]);
  }

  // if domain is invalid for more than 14 days, send email
  if (invalidDays == 14) {
    return await Promise.allSettled([
      log(`Domain *${domain}* is invalid for ${invalidDays} days, email sent.`),
      limiter.schedule(() =>
        sendInvalidDomainEmail(user.email!, domain, invalidDays)
      ),
    ]);
  }

  // if domain is invalid after the first day, send email
  if (invalidDays == 1) {
    return await Promise.allSettled([
      log(`Domain *${domain}* is invalid for ${invalidDays} days, email sent.`),
      limiter.schedule(() =>
        sendInvalidDomainEmail(user.email!, domain, invalidDays)
      ),
    ]);
  }

  return;
};
