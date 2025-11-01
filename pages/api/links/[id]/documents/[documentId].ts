import { NextApiRequest, NextApiResponse } from "next";

import { DataroomBrand, LinkAudienceType } from "@prisma/client";

import { fetchDataroomDocumentLinkData } from "@/lib/api/links/link-data";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { checkGlobalBlockList } from "@/lib/utils/global-block-list";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id, documentId: dataroomDocumentId } = req.query as {
    id: string;
    documentId: string;
  };

  try {
    // First fetch the link and verify it's a dataroom link
    const link = await prisma.link.findUnique({
      where: { id, linkType: "DATAROOM_LINK" },
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
        deletedAt: true,
        enableCustomMetatag: true,
        metaTitle: true,
        metaDescription: true,
        metaImage: true,
        metaFavicon: true,
        welcomeMessage: true,
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

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    if (link.deletedAt) {
      return res.status(404).json({ error: "Link has been deleted" });
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

    let brand: Partial<DataroomBrand> | null = null;
    let linkData: any;

    const data = await fetchDataroomDocumentLinkData({
      linkId: id,
      teamId: link.teamId!,
      dataroomDocumentId: dataroomDocumentId,
      permissionGroupId: link.permissionGroupId || undefined,
      ...(link.audienceType === LinkAudienceType.GROUP &&
        link.groupId && {
          groupId: link.groupId,
        }),
    });

    linkData = data.linkData;
    brand = data.brand;

    const teamPlan = link.team?.plan || "free";
    const linkType = link.linkType;

    const returnLink = {
      ...link,
      dataroomDocument: linkData.dataroom?.documents[0],
      ...(teamPlan === "free" && {
        customFields: [], // reset custom fields for free plan
        enableAgreement: false,
        enableWatermark: false,
        permissionGroupId: null,
      }),
    };

    return res.status(200).json({ linkType, link: returnLink, brand });
  } catch (error) {
    console.error("Error fetching document:", error);
    errorhandler(error, res);
  }
}
