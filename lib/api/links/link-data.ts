import prisma from "@/lib/prisma";
import { sortItemsByIndexAndName } from "@/lib/utils/sort-items-by-index-name";

export async function fetchDataroomLinkData({ linkId }: { linkId: string }) {
  const linkData = await prisma.link.findUnique({
    where: { id: linkId },
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
              orderIndex: true,
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
            orderBy: [
              { orderIndex: "asc" },
              {
                document: {
                  name: "asc",
                },
              },
            ],
          },
          folders: {
            orderBy: [
              { orderIndex: "asc" },
              {
                name: "asc",
              },
            ],
          },
        },
      },
    },
  });

  if (!linkData?.dataroom) {
    throw new Error("Dataroom not found");
  }

  // Sort documents by index or name
  linkData.dataroom.documents = sortItemsByIndexAndName(
    linkData.dataroom.documents,
  );

  const brand = await prisma.dataroomBrand.findFirst({
    where: {
      dataroomId: linkData.dataroom.id,
    },
    select: {
      logo: true,
      banner: true,
      brandColor: true,
    },
  });

  return { linkData, brand };
}

export async function fetchDocumentLinkData({ linkId }: { linkId: string }) {
  const linkData = await prisma.link.findUnique({
    where: { id: linkId },
    select: {
      document: {
        select: {
          id: true,
          name: true,
          assistantEnabled: true,
          teamId: true,
          ownerId: true,
          team: {
            select: { plan: true },
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

  if (!linkData?.document) {
    throw new Error("Document not found");
  }

  const brand = await prisma.brand.findFirst({
    where: {
      teamId: linkData.document.teamId,
    },
    select: {
      logo: true,
      brandColor: true,
      accentColor: true,
    },
  });

  return { linkData, brand };
}
