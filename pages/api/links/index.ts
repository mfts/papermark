import { NextApiResponse } from "next";

import { LinkAudienceType, Tag } from "@prisma/client";
import { waitUntil } from "@vercel/functions";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import {
  decryptEncrpytedPassword,
  generateEncrpytedPassword,
} from "@/lib/utils";
import { sendLinkCreatedWebhook } from "@/lib/webhook/triggers/link-created";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export interface DomainObject {
  id: string;
  slug: string;
}

export default createAuthenticatedHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const {
      targetId,
      linkType,
      password,
      expiresAt,
      teamId,
      enableIndexFile,
      ...linkDomainData
    } = req.body;

    const userId = req.user.id;

    const dataroomLink = linkType === "DATAROOM_LINK";
    const documentLink = linkType === "DOCUMENT_LINK";

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: { userId },
          },
        },
      });

      if (!team) {
        return res.status(400).json({ error: "Team not found." });
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

      if (linkData.enableAgreement && !linkData.agreementId) {
        return res.status(400).json({
          error: "No agreement selected.",
        });
      }

      if (
        linkData.audienceType === LinkAudienceType.GROUP &&
        !linkData.groupId
      ) {
        return res.status(400).json({
          error: "No group selected.",
        });
      }

      // Fetch the link and its related document from the database
      const updatedLink = await prisma.$transaction(async (tx) => {
        const link = await tx.link.create({
          data: {
            documentId: documentLink ? targetId : null,
            dataroomId: dataroomLink ? targetId : null,
            linkType,
            teamId,
            password: hashedPassword,
            name: linkData.name || null,
            emailProtected:
              linkData.audienceType === LinkAudienceType.GROUP
                ? true
                : linkData.emailProtected,
            emailAuthenticated: linkData.emailAuthenticated,
            expiresAt: exat,
            allowDownload: linkData.allowDownload,
            domainId: domainObj?.id || null,
            domainSlug: domain || null,
            slug: slug || null,
            enableIndexFile: enableIndexFile,
            enableNotification: linkData.enableNotification,
            enableFeedback: linkData.enableFeedback,
            enableScreenshotProtection: linkData.enableScreenshotProtection,
            enableCustomMetatag: linkData.enableCustomMetatag,
            metaTitle: linkData.metaTitle || null,
            metaDescription: linkData.metaDescription || null,
            metaImage: linkData.metaImage || null,
            metaFavicon: linkData.metaFavicon || null,
            allowList: linkData.allowList,
            denyList: linkData.denyList,
            audienceType: linkData.audienceType,
            groupId:
              linkData.audienceType === LinkAudienceType.GROUP
                ? linkData.groupId
                : null,
            ...(linkData.enableQuestion && {
              enableQuestion: linkData.enableQuestion,
              feedback: {
                create: {
                  data: {
                    question: linkData.questionText,
                    type: linkData.questionType,
                  },
                },
              },
            }),
            ...(linkData.enableAgreement && {
              enableAgreement: linkData.enableAgreement,
              agreementId: linkData.agreementId,
            }),
            ...(linkData.enableWatermark && {
              enableWatermark: linkData.enableWatermark,
              watermarkConfig: linkData.watermarkConfig,
            }),
            ...(linkData.enableUpload && {
              enableUpload: linkData.enableUpload,
              isFileRequestOnly: linkData.isFileRequestOnly,
              uploadFolderId: linkData.uploadFolderId,
            }),
            showBanner: linkData.showBanner,
            ...(linkData.customFields && {
              customFields: {
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
                },
              },
            }),
          },
          include: {
            customFields: true,
          },
        });

        let tags: Partial<Tag>[] = [];
        if (linkData.tags?.length) {
          // create tag items
          await tx.tagItem.createMany({
            data: linkData.tags.map((tagId: string) => ({
              tagId,
              itemType: "LINK_TAG",
              linkId: link.id,
              taggedBy: userId,
            })),
            skipDuplicates: true,
          });

          // return tags
          tags = await tx.tag.findMany({
            where: { id: { in: linkData.tags } },
            select: { id: true, name: true, color: true, description: true },
          });
        }

        return { ...link, tags };
      });

      const linkWithView = {
        ...updatedLink,
        _count: { views: 0 },
        views: [],
      };

      if (!linkWithView) {
        return res.status(404).json({ error: "Link not found" });
      }

      waitUntil(
        sendLinkCreatedWebhook({
          teamId,
          data: {
            link_id: linkWithView.id,
            document_id: linkWithView.documentId,
            dataroom_id: linkWithView.dataroomId,
          },
        }),
      );

      // Decrypt the password for the new link
      if (linkWithView.password !== null) {
        linkWithView.password = decryptEncrpytedPassword(linkWithView.password);
      }

      res.status(200).json(linkWithView);
      return;
    } catch (error) {
      errorhandler(error, res);
      return;
    }
  },
});
