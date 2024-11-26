import { NextApiRequest, NextApiResponse } from "next";

import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import { getIpAddress } from "@/lib/utils/ip";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // GET /api/links/download
    const { linkId, viewId } = req.body as { linkId: string; viewId: string };

    try {
      const view = await prisma.view.findUnique({
        where: {
          id: viewId,
          linkId: linkId,
        },
        select: {
          id: true,
          viewedAt: true,
          viewerEmail: true,
          link: {
            select: {
              allowDownload: true,
              expiresAt: true,
              isArchived: true,
              enableWatermark: true,
              watermarkConfig: true,
              name: true,
            },
          },
          document: {
            select: {
              teamId: true,
              downloadOnly: true,
              versions: {
                where: { isPrimary: true },
                select: {
                  type: true,
                  file: true,
                  storageType: true,
                  numPages: true,
                  originalFile: true,
                  contentType: true,
                },
                take: 1,
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
      if (!view.link.allowDownload && !view.document?.downloadOnly) {
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

      // if document is a Notion document, we should not allow the download
      if (view.document!.versions[0].type === "notion") {
        return res.status(403).json({ error: "Error downloading" });
      }

      // if viewedAt is longer than 30 mins ago, we should not allow the download
      if (
        view.viewedAt &&
        view.viewedAt < new Date(Date.now() - 30 * 60 * 1000)
      ) {
        return res.status(403).json({ error: "Error downloading" });
      }

      // update the view with the downloadedAt timestamp
      await prisma.view.update({
        where: { id: viewId },
        data: { downloadedAt: new Date() },
      });

      const downloadUrl = await getFile({
        type: view.document!.versions[0].storageType,
        data:
          view.document!.versions[0].originalFile ??
          view.document!.versions[0].file,
        isDownload: true,
      });

      if (
        view.document!.versions[0].type === "pdf" &&
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
              numPages: view.document!.versions[0].numPages,
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
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  }

  // We only allow POST requests
  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
