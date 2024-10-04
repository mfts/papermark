import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { hashPassword } from "@/lib/utils";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/links/:id/dataroom
    const { id } = req.query as { id: string };

    try {
      console.time("get-link");
      const link = await prisma.link.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          expiresAt: true,
          emailProtected: true,
          emailAuthenticated: true,
          allowDownload: true,
          enableFeedback: true,
          password: true,
          isArchived: true,
          enableCustomMetatag: true,
          enableScreenshotProtection: true,
          metaTitle: true,
          metaDescription: true,
          metaImage: true,
          metaFavicon: true,
          linkType: true,
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
                        },
                        take: 1,
                      },
                    },
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

      console.timeEnd("get-link");

      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }

      if (link.isArchived) {
        return res.status(404).json({ error: "Link is archived" });
      }

      let brand = await prisma.dataroomBrand.findFirst({
        where: {
          dataroomId: link.dataroom?.id!,
        },
        select: {
          logo: true,
          banner: true,
          brandColor: true,
        },
      });

      if (!brand) {
        brand = null;
      }

      const lastUpdatedAt = link.dataroom?.documents.reduce((acc, doc) => {
        if (doc.updatedAt.getTime() > acc.getTime()) {
          return doc.updatedAt;
        }
        return acc;
      }, new Date(0));

      return res.status(200).json({ link, brand, lastUpdatedAt });
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  }

  // We only allow GET and PUT requests
  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
