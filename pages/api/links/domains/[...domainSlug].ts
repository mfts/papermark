import { NextApiRequest, NextApiResponse } from "next";

import { Brand, DataroomBrand, LinkAudienceType } from "@prisma/client";

import { fetchDataroomDocumentLinkData } from "@/lib/api/links/link-data";
import {
  fetchDataroomLinkData,
  fetchDocumentLinkData,
} from "@/lib/api/links/link-data";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { checkGlobalBlockList } from "@/lib/utils/global-block-list";

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
    const documentId = domainSlug[3];

    if (slug === "404") {
      return res.status(404).json({
        error: "Link not found",
        message: "link not found",
      });
    }

    try {
      console.time("get-link");
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
          deletedAt: true,
          enableCustomMetatag: true,
          enableFeedback: true,
          enableScreenshotProtection: true,
          enableIndexFile: true,
          metaTitle: true,
          metaDescription: true,
          metaImage: true,
          metaFavicon: true,
          welcomeMessage: true,
          enableQuestion: true,
          dataroomId: true,
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

      if (link.deletedAt) {
        return res.status(404).json({
          error: "Link has been deleted",
          message: "This link has been deleted",
        });
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

      const teamPlan = link.team?.plan || "free";
      const teamId = link.teamId;
      // if owner of document is on free plan, return 404
      if (teamPlan.includes("free")) {
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

      // Handle workflow links separately
      if (linkType === "WORKFLOW_LINK") {
        // For workflow links, fetch brand if available
        let brand: Partial<Brand> | null = null;
        if (link.teamId) {
          const teamBrand = await prisma.brand.findUnique({
            where: { teamId: link.teamId },
            select: {
              logo: true,
              brandColor: true,
              accentColor: true,
            },
          });
          brand = teamBrand;
        }

        return res.status(200).json({ linkType, brand, linkId: link.id });
      }

      let brand: Partial<Brand> | Partial<DataroomBrand> | null = null;
      let linkData: any;

      if (linkType === "DOCUMENT_LINK") {
        console.time("get-document-link-data");
        const data = await fetchDocumentLinkData({
          linkId: link.id,
          teamId: link.teamId!,
        });
        linkData = data.linkData;
        brand = data.brand;
        console.timeEnd("get-document-link-data");
      } else if (linkType === "DATAROOM_LINK") {
        console.time("get-dataroom-link-data");
        if (documentId) {
          const data = await fetchDataroomDocumentLinkData({
            linkId: link.id,
            teamId: link.teamId!,
            dataroomDocumentId: documentId,
            permissionGroupId: link.permissionGroupId || undefined,
            ...(link.audienceType === LinkAudienceType.GROUP &&
              link.groupId && {
                groupId: link.groupId,
              }),
          });
          linkData = data.linkData;
          brand = data.brand;
        } else {
          const data = await fetchDataroomLinkData({
            linkId: link.id,
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
        }
        console.timeEnd("get-dataroom-link-data");
      }

      // remove document and domain from link
      const sanitizedLink = {
        ...link,
        teamId: undefined,
        team: undefined,
        document: undefined,
        dataroom: undefined,
        ...(teamPlan === "free" && {
          customFields: [], // reset custom fields for free plan
          enableAgreement: false,
          enableWatermark: false,
          permissionGroupId: null,
        }),
      };

      // clean up the link return object
      const returnLink = {
        ...sanitizedLink,
        ...linkData,
        dataroomDocument: linkData.dataroom?.documents[0] || undefined,
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
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
