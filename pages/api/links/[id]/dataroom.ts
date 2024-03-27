import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { hashPassword } from "@/lib/utils";
import { CustomUser } from "@/lib/types";
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
          metaTitle: true,
          metaDescription: true,
          metaImage: true,
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
              folders: true,
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

      let brand = await prisma.brand.findFirst({
        where: {
          teamId: link.dataroom?.teamId!,
        },
        select: {
          logo: true,
          brandColor: true,
        },
      });

      if (!brand) {
        brand = null;
      }

      return res.status(200).json({ link, brand });
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
