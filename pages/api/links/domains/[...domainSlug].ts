import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/links/domains/:domain/:slug
    // GET /api/links/domains/:domainSlug
    const { domainSlug } = req.query as { domainSlug: string[] };

    const domain = domainSlug[0];
    const slug = domainSlug[1];

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
          metaTitle: true,
          metaDescription: true,
          metaImage: true,
          document: {
            select: {
              id: true,
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

      if (!link || !link.document.team) {
        return res.status(404).json({
          error: "Link not found",
          message: `no link found, team ${link?.document.team}`,
        });
      }

      // if owner of document is on free plan, return 404
      if (link.document.team.plan === "free") {
        return res.status(404).json({
          error: "Link not found",
          message: `link found, team ${link.document.team.plan}`,
        });
      }

      let brand = await prisma.brand.findFirst({
        where: {
          teamId: link.document.team.id,
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
