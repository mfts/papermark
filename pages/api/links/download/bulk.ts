import { NextApiRequest, NextApiResponse } from "next";

import { InvocationType, InvokeCommand } from "@aws-sdk/client-lambda";
import { ItemType, ViewType } from "@prisma/client";

import { getLambdaClient } from "@/lib/files/aws-client";
import prisma from "@/lib/prisma";
import { getIpAddress } from "@/lib/utils/ip";

export const config = {
  maxDuration: 180,
  memory: 2048,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/links/download/bulk
    const { linkId, viewId } = req.body as { linkId: string; viewId: string };

    try {
      const view = await prisma.view.findUnique({
        where: {
          id: viewId,
          linkId: linkId,
          viewType: { equals: ViewType.DATAROOM_VIEW },
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
          groupId: true,
          dataroom: {
            select: {
              folders: {
                where: { removedAt: null },
                select: {
                  id: true,
                  name: true,
                  path: true,
                },
              },
              documents: {
                where: { removedAt: null },
                select: {
                  id: true,
                  folderId: true,
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
                          contentType: true,
                          numPages: true,
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

      // if viewedAt is longer than 23 hours ago, we should not allow the download
      if (
        view.viewedAt &&
        view.viewedAt < new Date(Date.now() - 23 * 60 * 60 * 1000)
      ) {
        return res.status(403).json({ error: "Error downloading" });
      }

      let downloadFolders = view.dataroom.folders;
      let downloadDocuments = view.dataroom.documents;

      // if groupId is not null,
      // we should find the group permissions
      // and reduce the number of documents and folders to download
      if (view.groupId) {
        const groupPermissions =
          await prisma.viewerGroupAccessControls.findMany({
            where: { groupId: view.groupId, canDownload: true },
          });

        const permittedFolderIds = groupPermissions
          .filter(
            (permission) => permission.itemType === ItemType.DATAROOM_FOLDER,
          )
          .map((permission) => permission.itemId);
        const permittedDocumentIds = groupPermissions
          .filter(
            (permission) => permission.itemType === ItemType.DATAROOM_DOCUMENT,
          )
          .map((permission) => permission.itemId);

        downloadFolders = downloadFolders.filter((folder) =>
          permittedFolderIds.includes(folder.id),
        );
        downloadDocuments = downloadDocuments.filter((doc) =>
          permittedDocumentIds.includes(doc.id),
        );
      }

      // update the view with the downloadedAt timestamp
      await prisma.view.update({
        where: { id: viewId },
        data: { downloadedAt: new Date() },
      });

      // Construct folderStructure and fileKeys
      const folderStructure: {
        [key: string]: {
          name: string;
          path: string;
          files: {
            name: string;
            key: string;
            type?: string;
            numPages?: number;
            needsWatermark?: boolean;
          }[];
        };
      } = {};
      const fileKeys: string[] = [];

      // Create a map of folder IDs to folder names
      const folderMap = new Map(
        downloadFolders.map((folder) => [
          folder.path,
          { name: folder.name, id: folder.id },
        ]),
      );

      const addFileToStructure = (
        path: string,
        fileName: string,
        fileKey: string,
        fileType?: string,
        numPages?: number,
      ) => {
        const pathParts = path.split("/").filter(Boolean);
        let currentPath = "";

        // Add folder information for each level of the path
        pathParts.forEach((part, index) => {
          currentPath += "/" + part;
          const folderInfo = folderMap.get(currentPath);
          if (!folderStructure[currentPath]) {
            folderStructure[currentPath] = {
              name: folderInfo ? folderInfo.name : part,
              path: currentPath,
              files: [],
            };
          }
        });

        // Add the file to the leaf folder
        if (!folderStructure[path]) {
          const folderInfo = folderMap.get(path) || { name: "Root", id: null };
          folderStructure[path] = {
            name: folderInfo.name,
            path: path,
            files: [],
          };
        }

        const needsWatermark =
          view.link.enableWatermark &&
          (fileType === "pdf" || fileType === "image");

        folderStructure[path].files.push({
          name: fileName,
          key: fileKey,
          type: fileType,
          numPages: numPages,
          needsWatermark: needsWatermark ?? undefined,
        });
        fileKeys.push(fileKey);
      };

      // Add root level documents
      downloadDocuments
        .filter((doc) => !doc.folderId)
        .filter((doc) => doc.document.versions[0].type !== "notion")
        .filter((doc) => doc.document.versions[0].storageType !== "VERCEL_BLOB")
        .forEach((doc) => {
          const fileKey =
            view.link.enableWatermark && doc.document.versions[0].type === "pdf"
              ? doc.document.versions[0].file
              : (doc.document.versions[0].originalFile ??
                doc.document.versions[0].file);

          addFileToStructure(
            "/",
            doc.document.name,
            fileKey,
            doc.document.versions[0].type ?? undefined,
            doc.document.versions[0].numPages ?? undefined,
          );
        });

      // Add documents in folders
      downloadFolders.forEach((folder) => {
        const folderDocs = downloadDocuments
          .filter((doc) => doc.folderId === folder.id)
          .filter((doc) => doc.document.versions[0].type !== "notion")
          .filter(
            (doc) => doc.document.versions[0].storageType !== "VERCEL_BLOB",
          );

        folderDocs &&
          folderDocs.forEach((doc) => {
            // Use .file if watermark is enabled and document is PDF, otherwise use .originalFile
            const fileKey =
              view.link.enableWatermark &&
              doc.document.versions[0].type === "pdf"
                ? doc.document.versions[0].file
                : (doc.document.versions[0].originalFile ??
                  doc.document.versions[0].file);

            addFileToStructure(
              folder.path,
              doc.document.name,
              fileKey,
              doc.document.versions[0].type ?? undefined,
              doc.document.versions[0].numPages ?? undefined,
            );
          });

        // If the folder is empty, ensure it's still added to the structure
        if (folderDocs && folderDocs.length === 0) {
          addFileToStructure(folder.path, "", "");
        }
      });

      if (fileKeys.length === 0) {
        return res.status(404).json({ error: "No files to download" });
      }

      const client = getLambdaClient();

      const params = {
        FunctionName: `bulk-download-zip-creator-${process.env.NODE_ENV === "development" ? "dev" : "prod"}`, // Use the name you gave your Lambda function
        InvocationType: InvocationType.RequestResponse,
        Payload: JSON.stringify({
          sourceBucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
          fileKeys: fileKeys,
          folderStructure: folderStructure,
          watermarkConfig: view.link.enableWatermark
            ? {
                enabled: true,
                config: view.link.watermarkConfig,
                viewerData: {
                  email: view.viewerEmail,
                  date: new Date(view.viewedAt).toLocaleDateString(),
                  time: new Date(view.viewedAt).toLocaleTimeString(),
                  link: view.link.name,
                  ipAddress: getIpAddress(req.headers),
                },
              }
            : { enabled: false },
        }),
      };

      try {
        const command = new InvokeCommand(params);
        const response = await client.send(command);

        if (response.Payload) {
          const decodedPayload = new TextDecoder().decode(response.Payload);

          const payload = JSON.parse(decodedPayload);
          const { downloadUrl } = JSON.parse(payload.body);

          res.status(200).json({ downloadUrl });
        } else {
          throw new Error("Payload is undefined or empty");
        }
      } catch (error) {
        console.error("Error invoking Lambda:", error);
        res.status(500).json({
          error: "Failed to generate download link",
          details: (error as Error).message,
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
