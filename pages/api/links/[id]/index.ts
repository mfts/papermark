import { NextApiRequest, NextApiResponse } from "next";

import { Brand, DataroomBrand, LinkAudienceType, ParsingStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { waitUntil } from "@vercel/functions";

import {
  fetchDataroomLinkData,
  fetchDocumentLinkData,
} from "@/lib/api/links/link-data";
import prisma from "@/lib/prisma";
import { triggerDataroomIndexing } from "@/lib/rag/indexing-trigger";
import { CustomUser } from "@/lib/types";
import {
  decryptEncrpytedPassword,
  generateEncrpytedPassword,
} from "@/lib/utils";
import { checkGlobalBlockList } from "@/lib/utils/global-block-list";
import { log } from "@/lib/utils";

import { DomainObject } from "..";
import { authOptions } from "../../auth/[...nextauth]";
import { getFeatureFlags } from "@/lib/featureFlags";

export const config = {
  supportsResponseStreaming: true,
};

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
          enableIndexFile: true,
          enableCustomMetatag: true,
          metaTitle: true,
          metaDescription: true,
          metaImage: true,
          metaFavicon: true,
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
          showBanner: true,
          enableWatermark: true,
          watermarkConfig: true,
          groupId: true,
          permissionGroupId: true,
          audienceType: true,
          dataroomId: true,
          teamId: true,
          team: {
            select: {
              plan: true,
              globalBlockList: true,
            },
          },
          customFields: {
            select: {
              id: true,
              type: true,
              identifier: true,
              label: true,
              placeholder: true,
              required: true,
              disabled: true,
              orderIndex: true,
            },
            orderBy: {
              orderIndex: "asc",
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

      const { email } = req.query as { email?: string };
      const globalBlockCheck = checkGlobalBlockList(
        email,
        link.team?.globalBlockList,
      );
      if (globalBlockCheck.error) {
        return res.status(400).json({ message: globalBlockCheck.error });
      }
      if (globalBlockCheck.isBlocked) {
        return res.status(403).json({ message: "Access denied" });
      }

      const linkType = link.linkType;

      let brand: Partial<Brand> | Partial<DataroomBrand> | null = null;
      let linkData: any;

      if (linkType === "DOCUMENT_LINK") {
        console.time("get-document-link-data");
        const data = await fetchDocumentLinkData({
          linkId: id,
          teamId: link.teamId!,
        });
        linkData = data.linkData;
        brand = data.brand;
        console.timeEnd("get-document-link-data");
      } else if (linkType === "DATAROOM_LINK") {
        console.time("get-dataroom-link-data");
        const data = await fetchDataroomLinkData({
          linkId: id,
          dataroomId: link.dataroomId,
          teamId: link.teamId!,
          permissionGroupId: link.permissionGroupId || undefined,
          ...(link.audienceType === LinkAudienceType.GROUP &&
            link.groupId && {
              groupId: link.groupId,
            }),
        });
        linkData = data.linkData;
        brand = data.brand;
        // Include access controls in the link data for the frontend
        linkData.accessControls = data.accessControls;
        console.timeEnd("get-dataroom-link-data");
      }

      const teamPlan = link.team?.plan || "free";

      const returnLink = {
        ...link,
        ...linkData,
        dataroomId: undefined,
        ...(teamPlan === "free" && {
          customFields: [], // reset custom fields for free plan
          enableAgreement: false,
          enableWatermark: false,
          permissionGroupId: null,
        }),
      };

      return res.status(200).json({ linkType, link: returnLink, brand });
    } catch (error) {
      console.error("Error fetching link data:", error);
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

    const userId = (session.user as CustomUser).id;
    const { id } = req.query as { id: string };
    const {
      targetId,
      linkType,
      password,
      expiresAt,
      teamId,
      ...linkDomainData
    } = req.body;

    const dataroomLink = linkType === "DATAROOM_LINK";
    const documentLink = linkType === "DOCUMENT_LINK";

    try {
      const existingLink = await prisma.link.findUnique({
        where: {
          id: id,
          teamId: teamId,
          team: {
            users: {
              some: { userId },
            },
          },
        },
      });

      if (!existingLink) {
        return res
          .status(404)
          .json({ error: "Link not found or unauthorized" });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }

    const hashedPassword =
      password && password.length > 0
        ? await generateEncrpytedPassword(password)
        : null;
    const exat = expiresAt ? new Date(expiresAt) : null;

    let { domain, slug, ...linkData } = linkDomainData;

    // set domain and slug to null if the domain is papermark.com
    if (domain && domain === "papermark.com") {
      domain = null;
      slug = null;
    }

    let domainObj: DomainObject | null;

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

    const updatedLink = await prisma.$transaction(async (tx) => {
      const link = await tx.link.update({
        where: { id, teamId },
        data: {
          documentId: documentLink ? targetId : null,
          dataroomId: dataroomLink ? targetId : null,
          password: hashedPassword,
          name: linkData.name || null,
          emailProtected:
            linkData.audienceType === LinkAudienceType.GROUP
              ? true
              : linkData.emailProtected,
          emailAuthenticated: linkData.emailAuthenticated,
          allowDownload: linkData.allowDownload,
          allowList: linkData.allowList,
          denyList: linkData.denyList,
          expiresAt: exat,
          domainId: domainObj?.id || null,
          domainSlug: domain || null,
          slug: slug || null,
          enableIndexFile: linkData.enableIndexFile || false,
          enableNotification: linkData.enableNotification,
          enableFeedback: linkData.enableFeedback,
          enableScreenshotProtection: linkData.enableScreenshotProtection,
          enableCustomMetatag: linkData.enableCustomMetatag,
          metaTitle: linkData.metaTitle || null,
          metaDescription: linkData.metaDescription || null,
          metaImage: linkData.metaImage || null,
          metaFavicon: linkData.metaFavicon || null,
          ...(linkData.customFields && {
            customFields: {
              deleteMany: {}, // Delete all existing custom fields
              createMany: {
                data: linkData.customFields.map(
                  (field: any, index: number) => ({
                    type: field.type,
                    identifier: field.identifier,
                    label: field.label,
                    placeholder: field.placeholder,
                    required: field.required,
                    disabled: field.disabled,
                    orderIndex: index,
                  }),
                ),
                skipDuplicates: true,
              },
            },
          }),
          enableQuestion: linkData.enableQuestion,
          ...(linkData.enableQuestion && {
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
          }),
          enableAgreement: linkData.enableAgreement,
          agreementId: linkData.agreementId || null,
          showBanner: linkData.showBanner,
          enableWatermark: linkData.enableWatermark || false,
          watermarkConfig: linkData.watermarkConfig || null,
          groupId: linkData.groupId || null,
          permissionGroupId: linkData.permissionGroupId || null,
          audienceType: linkData.audienceType || LinkAudienceType.GENERAL,
          enableConversation: linkData.enableConversation || false,
          enableUpload: linkData.enableUpload || false,
          isFileRequestOnly: linkData.isFileRequestOnly || false,
          uploadFolderId: linkData.uploadFolderId || null,
        },
        include: {
          customFields: true,
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
      if (linkData.tags?.length) {
        // Remove only tags that are not in the new list
        await tx.tagItem.deleteMany({
          where: {
            linkId: id,
            itemType: "LINK_TAG",
            tagId: { notIn: linkData.tags },
          },
        });

        // Add new tags while avoiding duplicates
        await tx.tagItem.createMany({
          data: linkData.tags.map((tagId: string) => ({
            tagId,
            itemType: "LINK_TAG",
            linkId: id,
            taggedBy: userId,
          })),
          skipDuplicates: true,
        });
      } else {
        // If all tags are removed, delete all tagged items for this link
        await tx.tagItem.deleteMany({
          where: {
            linkId: id,
            itemType: "LINK_TAG",
          },
        });
      }

      const tags = await tx.tag.findMany({
        where: {
          items: {
            some: { linkId: link.id },
          },
        },
        select: {
          id: true,
          name: true,
          color: true,
          description: true,
        },
      });

      return { ...link, tags };
    });

    if (!updatedLink) {
      return res.status(404).json({ error: "Link not found" });
    }

    await fetch(
      `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&linkId=${id}&hasDomain=${updatedLink.domainId ? "true" : "false"}`,
    );

    const features = await getFeatureFlags({ teamId: teamId! });
    if (features.ragIndexing) {
      const indexingPromise = triggerDataroomIndexing(
        targetId, teamId, userId
      );
      try {
        waitUntil(indexingPromise);
      } catch {
        void indexingPromise.catch((e) =>
          console.error(
            `RAG indexing trigger (fallback) failed for dataroom ${targetId}.`,
            e
          )
        );
      }
    } 

    // Decrypt the password for the updated link
    if (updatedLink.password !== null) {
      updatedLink.password = decryptEncrpytedPassword(updatedLink.password);
    }

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
  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
