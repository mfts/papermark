import { NextApiRequest, NextApiResponse } from "next";

import { Brand, DataroomBrand } from "@prisma/client";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Immediately set the Cache-Control header to prevent any form of caching
  // res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");

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
          linkType: true,
          feedback: {
            select: {
              id: true,
              data: true,
            },
          },
          enableAgreement: true,
          agreement: true,
          document: {
            select: {
              team: {
                select: {
                  id: true,
                  plan: true,
                },
              },
            },
          },
          dataroom: {
            select: {
              team: {
                select: {
                  id: true,
                  plan: true,
                },
              },
            },
          },
        },
      });

      // if link not found, return 404
      if (!link) {
        log({
          message: `Link not found for custom domain _${domain}/${slug}_`,
          type: "error",
          mention: true,
        });
        return res.status(404).json({
          error: "Link not found",
          message: "No link found",
        });
      }

      if (link.isArchived) {
        return res.status(404).json({
          error: "Link is archived",
          message: "link is archived",
        });
      }

      const teamPlan = link.document?.team?.plan || link.dataroom?.team.plan;
      const teamId = link.document?.team?.id || link.dataroom?.team.id;
      // if owner of document is on free plan, return 404
      if (teamPlan === "free") {
        log({
          message: `Link is from a free team _${teamId}_ for custom domain _${domain}/${slug}_`,
          type: "info",
          mention: true,
        });
        return res.status(404).json({
          error: "Link not found",
          message: `link found, team ${teamPlan}`,
        });
      }

      const linkType = link.linkType;
      let brand: Partial<Brand> | Partial<DataroomBrand> | null = null;
      let linkData: any;

      if (linkType === "DOCUMENT_LINK") {
        linkData = await prisma.link.findUnique({
          where: { id: link.id },
          select: {
            document: {
              select: {
                id: true,
                name: true,
                teamId: true,
                ownerId: true,
                team: { select: { plan: true } },
                versions: {
                  where: { isPrimary: true },
                  select: {
                    id: true,
                    versionNumber: true,
                    hasPages: true,
                    type: true,
                    file: true,
                    isVertical: true,
                  },
                  take: 1,
                },
              },
            },
          },
        });

        brand = await prisma.brand.findFirst({
          where: {
            teamId: linkData.document.teamId,
          },
          select: {
            logo: true,
            brandColor: true,
          },
        });
      } else if (linkType === "DATAROOM_LINK") {
        linkData = await prisma.link.findUnique({
          where: { id: link.id },
          select: {
            dataroom: {
              select: {
                id: true,
                name: true,
                teamId: true,
                documents: {
                  select: {
                    id: true,
                    folderId: true,
                    updatedAt: true,
                    document: {
                      select: {
                        id: true,
                        name: true,
                        versions: {
                          where: { isPrimary: true },
                          select: {
                            id: true,
                            versionNumber: true,
                            type: true,
                            hasPages: true,
                            file: true,
                            isVertical: true,
                          },
                          take: 1,
                        },
                      },
                    },
                  },
                  orderBy: {
                    document: {
                      name: "asc",
                    },
                  },
                },
                folders: {
                  orderBy: {
                    name: "asc",
                  },
                },
              },
            },
          },
        });

        brand = await prisma.dataroomBrand.findFirst({
          where: {
            dataroomId: linkData.dataroom.id,
          },
          select: {
            logo: true,
            banner: true,
            brandColor: true,
          },
        });
      }

      // remove document and domain from link
      const sanitizedLink = {
        ...link,
        document: undefined,
        dataroom: undefined,
      };

      // clean up the link return object
      const returnLink = {
        ...sanitizedLink,
        ...linkData,
      };

      res.status(200).json({ linkType, link: returnLink, brand });
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
