import prisma from "@/lib/prisma";
import { getApexDomain, removeDomainFromResend, removeDomainFromVercel } from "../domains";

// calculate the domainCount
export async function getDomainCount(domain: string) {
  const apexDomain = getApexDomain(`https://${domain}`);
  const response = await prisma.domain.count({
    where: {
      OR: [
        {
          slug: apexDomain,
        },
        {
          slug: {
            endsWith: `.${apexDomain}`,
          },
        },
      ],
    },
  });

  return response;
}

/* Delete a domain */
export async function deleteDomain(
  domain: string,
  {
    // Note: in certain cases, we don't need to remove the domain from the Prisma
    skipPrismaDelete = false,
  } = {}
) {
  const domainCount = await getDomainCount(domain);

  return await Promise.allSettled([
    // remove the domain from Vercel and Resend
    removeDomainFromVercel(domain, domainCount),
    removeDomainFromResend(domain),
    // delete domain
    !skipPrismaDelete &&
      prisma.domain.delete({
        where: {
          slug: domain,
        },
      }),
  ]);
}
