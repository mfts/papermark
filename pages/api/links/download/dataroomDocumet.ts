import { NextApiRequest, NextApiResponse } from "next";

import { ItemType, ViewType } from "@prisma/client";

import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import { getIpAddress } from "@/lib/utils/ip";

export const config = {
  maxDuration: 180,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/links/download/dataroomDocumet
    const { linkId, viewId, documentId } = req.body as {
      linkId: string;
      viewId: string;
      documentId: string;
    };

    try {
      const view = await prisma.view.findUnique({
        where: {
          id: viewId,
          linkId: linkId,
          viewType: { equals: ViewType.DATAROOM_VIEW },
        },
        select: {
          viewerId: true,
          verified: true,
          id: true,
          viewerEmail: true,
          viewedAt: true,
          link: {
            select: {
              enableWatermark: true,
              allowDownload: true,
              expiresAt: true,
              watermarkConfig: true,
              name: true,
              isArchived: true,
            },
          },
          groupId: true,
          dataroom: {
            select: {
              id: true,
              documents: {
                where: {
                  documentId: documentId,
                },
                select: {
                  id: true,
                  document: {
                    select: {
                      name: true,
                      versions: {
                        where: { isPrimary: true },
                        select: {
                          type: true,
                          file: true,
                          storageType: true,
                          originalFile: true,
                          numPages: true,
                          contentType: true,
                        },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // if view does not exist, we should not allow the download
      if (!view) {
        return res.status(404).json({ error: "Error downloading" });
      }

      // if link does not allow download, we should not allow the download
      if (!view.link.allowDownload) {
        return res.status(403).json({ error: "Error downloading" });
      }

      // if link is archived, we should not allow the download
      if (view.link.isArchived) {
        return res.status(403).json({ error: "Error downloading" });
      }

      // if link is expired, we should not allow the download
      if (view.link.expiresAt && view.link.expiresAt < new Date()) {
        return res.status(403).json({ error: "Error downloading" });
      }

      // if dataroom does not exist, we should not allow the download
      if (!view.dataroom) {
        return res.status(404).json({ error: "Error downloading" });
      }

      // if viewedAt is longer than 30 mins ago, we should not allow the download
      if (
        view.viewedAt &&
        view.viewedAt < new Date(Date.now() - 30 * 60 * 1000)
      ) {
        return res.status(403).json({ error: "Error downloading" });
      }

      let downloadDocuments = view.dataroom.documents;

      // if groupId is not null,
      // we should find the group permissions
      // and reduce the number of documents and folders to download
      if (view.groupId) {
        const groupPermissions =
          await prisma.viewerGroupAccessControls.findMany({
            where: { groupId: view.groupId, canDownload: true },
          });

        const permittedDocumentIds = groupPermissions
          .filter(
            (permission) => permission.itemType === ItemType.DATAROOM_DOCUMENT,
          )
          .map((permission) => permission.itemId);

        downloadDocuments = downloadDocuments.filter((doc) =>
          permittedDocumentIds.includes(doc.id),
        );
      }

      //creates new view for document
      await prisma.view.create({
        data: {
          viewType: "DOCUMENT_VIEW",
          documentId: documentId,
          linkId: linkId,
          dataroomId: view.dataroom.id,
          groupId: view.groupId,
          dataroomViewId: view.id,
          viewerEmail: view.viewerEmail,
          downloadedAt: new Date(),
          viewerId: view.viewerId,
          verified: view.verified,
        },
      });

      const downloadUrl = await getFile({
        type: downloadDocuments[0].document!.versions[0].storageType,
        data:
          downloadDocuments[0].document!.versions[0].originalFile ??
          downloadDocuments[0].document!.versions[0].file,
        isDownload: true,
      });

      if (
        downloadDocuments[0].document!.versions[0].type === "pdf" &&
        view.link.enableWatermark
      ) {
        const response = await fetch(
          `${process.env.NEXTAUTH_URL}/api/mupdf/annotate-document`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: downloadUrl,
              numPages: downloadDocuments[0].document!.versions[0].numPages,
              watermarkConfig: view.link.watermarkConfig,
              viewerData: {
                email: view.viewerEmail,
                date: new Date(view.viewedAt).toLocaleDateString(),
                ipAddress: getIpAddress(req.headers),
                link: view.link.name,
                time: new Date(view.viewedAt).toLocaleTimeString(),
              },
            }),
          },
        );

        if (!response.ok) {
          return res.status(500).json({ error: "Error downloading" });
        }

        const pdfBuffer = await response.arrayBuffer();

        // Set appropriate headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="watermarked.pdf"',
        );

        // Send the buffer directly
        return res.send(Buffer.from(pdfBuffer));
      }

      return res.status(200).json({ downloadUrl });
      // Add documents in folders
    } catch {}
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
