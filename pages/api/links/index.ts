import { NextApiRequest, NextApiResponse } from "next";

import { LinkAudienceType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import {
  decryptEncrpytedPassword,
  generateEncrpytedPassword,
} from "@/lib/utils";

import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // POST /api/links
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      targetId,
      linkType,
      password,
      expiresAt,
      teamId,
      ...linkDomainData
    } = req.body;

    const userId = (session.user as CustomUser).id;

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
      const link = await prisma.link.create({
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
          enableNotification: linkData.enableNotification,
          enableFeedback: linkData.enableFeedback,
          enableScreenshotProtection: linkData.enableScreenshotProtection,
          screenShieldPercentage: linkData.screenShieldPercentage,
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
          showBanner: linkData.showBanner,
        },
      });

      const linkWithView = {
        ...link,
        _count: { views: 0 },
        views: [],
      };

      if (!linkWithView) {
        return res.status(404).json({ error: "Link not found" });
      }

      // Decrypt the password for the new link
      if (linkWithView.password !== null) {
        linkWithView.password = decryptEncrpytedPassword(linkWithView.password);
      }

      return res.status(200).json(linkWithView);
    } catch (error) {
      errorhandler(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
