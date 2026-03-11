import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { LinkAudienceType } from "@prisma/client";
import { getServerSession } from "next-auth";

import { fetchDataroomLinkData } from "@/lib/api/links/link-data";
import { verifyDataroomSession } from "@/lib/auth/dataroom-auth";
import { verifyPreviewSession } from "@/lib/auth/preview-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } },
) {
  try {
    const { linkId } = params;

    if (!linkId) {
      return NextResponse.json(
        { error: "Missing linkId" },
        { status: 400 },
      );
    }

    const link = await prisma.link.findUnique({
      where: { id: linkId, deletedAt: null },
      select: {
        id: true,
        dataroomId: true,
        teamId: true,
        groupId: true,
        permissionGroupId: true,
        audienceType: true,
        linkType: true,
      },
    });

    if (!link || link.linkType !== "DATAROOM_LINK" || !link.dataroomId) {
      return NextResponse.json(
        { error: "Link not found" },
        { status: 404 },
      );
    }

    // Authenticate: verify dataroom session cookie OR preview token
    let isAuthenticated = false;

    // 1. Try dataroom session (set by /api/views-dataroom after auth)
    const session = await verifyDataroomSession(
      request,
      linkId,
      link.dataroomId,
    );
    if (session) {
      isAuthenticated = true;
    }

    // 2. Try preview token (for team member previews)
    if (!isAuthenticated) {
      const previewToken = request.nextUrl.searchParams.get("previewToken");
      if (previewToken) {
        const nextAuthSession = await getServerSession(authOptions);
        const userId = (nextAuthSession?.user as CustomUser)?.id;
        if (userId) {
          const previewSession = await verifyPreviewSession(
            previewToken,
            userId,
            linkId,
          );
          if (previewSession) {
            isAuthenticated = true;
          }
        }
      }
    }

    // 3. Try team member preview (query param preview=true with active session)
    if (!isAuthenticated) {
      const isPreview = request.nextUrl.searchParams.get("preview") === "true";
      if (isPreview) {
        const nextAuthSession = await getServerSession(authOptions);
        const userId = (nextAuthSession?.user as CustomUser)?.id;
        if (userId && link.teamId) {
          const teamMember = await prisma.userTeam.findFirst({
            where: { userId, teamId: link.teamId },
            select: { userId: true },
          });
          if (teamMember) {
            isAuthenticated = true;
          }
        }
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Fetch full dataroom data (documents + folders)
    if (!link.teamId) {
      return NextResponse.json(
        { error: "Link configuration error" },
        { status: 500 },
      );
    }

    const data = await fetchDataroomLinkData({
      linkId: link.id,
      dataroomId: link.dataroomId,
      teamId: link.teamId,
      permissionGroupId: link.permissionGroupId || undefined,
      ...(link.audienceType === LinkAudienceType.GROUP &&
        link.groupId && {
          groupId: link.groupId,
        }),
    });

    const { linkData, accessControls } = data;
    const dataroom = linkData.dataroom;

    if (!dataroom) {
      return NextResponse.json(
        { error: "Dataroom not found" },
        { status: 404 },
      );
    }

    // Process documents: strip file URLs, compute updatedAt
    const documents = [];
    for (const document of dataroom.documents) {
      const primaryVersion = document.document.versions[0];
      if (!primaryVersion) continue;

      const { file, updatedAt, ...versionWithoutFile } = primaryVersion;

      documents.push({
        ...document.document,
        dataroomDocumentId: document.id,
        folderId: document.folderId,
        orderIndex: document.orderIndex,
        hierarchicalIndex: document.hierarchicalIndex,
        versions: [
          {
            ...versionWithoutFile,
            updatedAt:
              document.updatedAt > updatedAt ? document.updatedAt : updatedAt,
          },
        ],
      });
    }

    return NextResponse.json({
      dataroom: {
        id: dataroom.id,
        name: dataroom.name,
        description: dataroom.description,
        teamId: dataroom.teamId,
        allowBulkDownload: dataroom.allowBulkDownload,
        showLastUpdated: dataroom.showLastUpdated,
        introductionEnabled: dataroom.introductionEnabled,
        introductionContent: dataroom.introductionContent,
        documents,
        folders: dataroom.folders,
      },
      accessControls,
    });
  } catch (error) {
    console.error("[dataroom-content] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
