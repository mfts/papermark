import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Immediately set the Cache-Control header to prevent any form of caching
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");

  if (req.method === "GET") {
    // GET /api/links/domains/:domain/:slug
    const { domainSlug } = req.query as { domainSlug: string[] };

    const domain = domainSlug[0];
    const slug = domainSlug[1];

    if (slug === "404") {
      return res.status(404).json({
        error: "Link not found",
        message: "link not found",
      });
    }

    try {
      const link = await prisma.link.findUnique({
        where: {
          domainSlug_slug: {
            slug: slug,
            domainSlug: domain,
          },
        },
        select: {
          id: true,
          expiresAt: true,
          emailProtected: true,
          allowDownload: true,
          password: true,
          isArchived: true,
          enableCustomMetatag: true,
          enableFeedback: true,
          enableScreenshotProtection: true,
          metaTitle: true,
          metaDescription: true,
          metaImage: true,
          enableQuestion: true,
          feedback: {
            select: {
              id: true,
              data: true,
            },
          },
          document: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              team: { select: { id: true, plan: true } },
              versions: {
                where: { isPrimary: true },
                select: {
                  id: true,
                  versionNumber: true,
                  hasPages: true,
                  type: true,
                  file: true,
                },
                take: 1,
              },
            },
          },
        },
      });

      // if link not found, return 404
      if (!link || !link.document!.team) {
        log({
          message: `Link not found for custom domain _${domain}/${slug}_`,
          type: "error",
          mention: true,
        });
        return res.status(404).json({
          error: "Link not found",
          message: `no link found, team ${link?.document!.team}`,
        });
      }

      // if owner of document is on free plan, return 404
      if (link.document!.team.plan === "free") {
        log({
          message: `Link is from a free team _${link.document!.team.id}_ for custom domain _${domain}/${slug}_`,
          type: "info",
          mention: true,
        });
        return res.status(404).json({
          error: "Link not found",
          message: `link found, team ${link.document!.team.plan}`,
        });
      }

      if (link.isArchived) {
        return res.status(404).json({
          error: "Link is archived",
          message: "link is archived",
        });
      }

      let brand = await prisma.brand.findFirst({
        where: {
          teamId: link.document!.team.id,
        },
        select: {
          logo: true,
          brandColor: true,
        },
      });

      if (!brand) {
        brand = null;
      }

      res.status(200).json({ link, brand });
    } catch (error) {
      log({
        message: `Cannot get link for custom domain _${domainSlug}_ \n\n${error}`,
        type: "error",
        mention: true,
      });
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
