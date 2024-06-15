import { NextApiRequest, NextApiResponse } from "next";

import { Brand, DataroomBrand } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { generateEncrpytedPassword } from "@/lib/utils";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/links/:id
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
          enableScreenshotProtection: true,
          password: true,
          isArchived: true,
          enableCustomMetatag: true,
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
        },
      });

      console.timeEnd("get-link");

      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }

      if (link.isArchived) {
        return res.status(404).json({ error: "Link is archived" });
      }

      const linkType = link.linkType;

      let brand: Partial<Brand> | Partial<DataroomBrand> | null = null;
      let linkData: any;

      if (linkType === "DOCUMENT_LINK") {
        linkData = await prisma.link.findUnique({
          where: { id: id },
          select: {
            document: {
              select: {
                id: true,
                name: true,
                assistantEnabled: true,
                teamId: true,
                ownerId: true,
                team: {
                  select: {
                    plan: true,
                  },
                },
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
          where: { id: id },
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

      const returnLink = {
        ...link,
        ...linkData,
      };

      return res.status(200).json({ linkType, link: returnLink, brand });
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "PUT") {
    // PUT /api/links/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };
    const { targetId, linkType, password, expiresAt, ...linkDomainData } =
      req.body;

    const dataroomLink = linkType === "DATAROOM_LINK";
    const documentLink = linkType === "DOCUMENT_LINK";

    const hashedPassword =
      password && password.length > 0
        ? await generateEncrpytedPassword(password)
        : null;
    const exat = expiresAt ? new Date(expiresAt) : null;

    let { domain, slug, ...linkData } = linkDomainData;

    // set domain and slug to null if the domain is papermark.io
    if (domain && domain === "papermark.io") {
      domain = null;
      slug = null;
    }

    let domainObj;

    if (domain && slug) {
      domainObj = await prisma.domain.findUnique({
        where: {
          slug: domain,
        },
      });

      if (!domainObj) {
        return res.status(400).json({ error: "Domain not found." });
      }

      const currentLink = await prisma.link.findUnique({
        where: { id: id },
        select: {
          id: true,
          domainSlug: true,
          slug: true,
        },
      });

      // if the slug or domainSlug has changed, check if the new slug is unique
      if (currentLink?.slug !== slug || currentLink?.domainSlug !== domain) {
        const existingLink = await prisma.link.findUnique({
          where: {
            domainSlug_slug: {
              slug: slug,
              domainSlug: domain,
            },
          },
        });

        if (existingLink) {
          return res.status(400).json({
            error: "The link already exists.",
          });
        }
      }
    }

    if (linkData.enableAgreement && !linkData.agreementId) {
      return res.status(400).json({
        error: "No agreement selected.",
      });
    }

    // Update the link in the database
    const updatedLink = await prisma.link.update({
      where: { id: id },
      data: {
        documentId: documentLink ? targetId : null,
        dataroomId: dataroomLink ? targetId : null,
        password: hashedPassword,
        name: linkData.name || null,
        emailProtected: linkData.emailProtected,
        emailAuthenticated: linkData.emailAuthenticated,
        allowDownload: linkData.allowDownload,
        allowList: linkData.allowList,
        denyList: linkData.denyList,
        expiresAt: exat,
        domainId: domainObj?.id || null,
        domainSlug: domain || null,
        slug: slug || null,
        enableNotification: linkData.enableNotification,
        enableFeedback: linkData.enableFeedback,
        enableScreenshotProtection: linkData.enableScreenshotProtection,
        enableCustomMetatag: linkData.enableCustomMetatag,
        metaTitle: linkData.metaTitle || null,
        metaDescription: linkData.metaDescription || null,
        metaImage: linkData.metaImage || null,
        enableQuestion: linkData.enableQuestion,
        feedback: {
          upsert: {
            create: {
              data: {
                question: linkData.questionText,
                type: linkData.questionType,
              },
            },
            update: {
              data: {
                question: linkData.questionText,
                type: linkData.questionType,
              },
            },
          },
        },
        enableAgreement: linkData.enableAgreement,
        agreementId: linkData.agreementId || null,
      },
      include: {
        views: {
          orderBy: {
            viewedAt: "desc",
          },
        },
        _count: {
          select: { views: true },
        },
      },
    });

    if (!updatedLink) {
      return res.status(404).json({ error: "Link not found" });
    }

    await fetch(
      `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&linkId=${id}&hasDomain=${updatedLink.domainId ? "true" : "false"}`,
    );

    return res.status(200).json(updatedLink);
  } else if (req.method == "DELETE") {
    // DELETE /api/links/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    try {
      const linkToBeDeleted = await prisma.link.findUnique({
        where: {
          id: id,
        },
        include: {
          document: {
            select: {
              ownerId: true,
            },
          },
        },
      });

      if (!linkToBeDeleted) {
        return res.status(404).json({ error: "Link not found" });
      }

      if (
        linkToBeDeleted.document!.ownerId !== (session.user as CustomUser).id
      ) {
        return res.status(401).end("Unauthorized to access the link");
      }

      await prisma.link.delete({
        where: {
          id: id,
        },
      });

      res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  }

  // We only allow GET and PUT requests
  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
