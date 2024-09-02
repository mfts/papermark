import { NextApiRequest, NextApiResponse } from "next";

import { InvocationType, InvokeCommand } from "@aws-sdk/client-lambda";
import { ViewType } from "@prisma/client";

import { getLambdaClient } from "@/lib/files/aws-client";
import prisma from "@/lib/prisma";

export const config = {
  maxDuration: 180,
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
          link: {
            select: {
              allowDownload: true,
              expiresAt: true,
              isArchived: true,
            },
          },
          dataroom: {
            select: {
              folders: {
                select: {
                  id: true,
                  name: true,
                  path: true,
                },
              },
              documents: {
                select: {
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
          files: { name: string; key: string }[];
        };
      } = {};
      const fileKeys: string[] = [];

      // Create a map of folder IDs to folder names
      const folderMap = new Map(
        view.dataroom.folders.map((folder) => [
          folder.path,
          { name: folder.name, id: folder.id },
        ]),
      );

      // Helper function to add a file to the structure
      const addFileToStructure = (
        path: string,
        fileName: string,
        fileKey: string,
      ) => {
        const folderInfo = folderMap.get(path) || { name: "Root", id: null };
        if (!folderStructure[path]) {
          folderStructure[path] = {
            name: folderInfo.name,
            path: path,
            files: [],
          };
        }
        folderStructure[path].files.push({ name: fileName, key: fileKey });
        fileKeys.push(fileKey);
      };

      // Add root level documents
      view.dataroom.documents
        .filter((doc) => !doc.folderId)
        .filter((doc) => doc.document.versions[0].type !== "notion")
        .filter((doc) => doc.document.versions[0].storageType !== "VERCEL_BLOB")
        .forEach((doc) =>
          addFileToStructure(
            "/",
            doc.document.name,
            doc.document.versions[0].file,
          ),
        );

      // Add documents in folders
      view.dataroom.folders.forEach((folder) => {
        const folderDocs =
          view.dataroom &&
          view.dataroom.documents
            .filter((doc) => doc.folderId === folder.id)
            .filter((doc) => doc.document.versions[0].type !== "notion")
            .filter(
              (doc) => doc.document.versions[0].storageType !== "VERCEL_BLOB",
            );

        folderDocs &&
          folderDocs.forEach((doc) =>
            addFileToStructure(
              folder.path,
              doc.document.name,
              doc.document.versions[0].file,
            ),
          );
      });

      const client = getLambdaClient();

      const params = {
        FunctionName: "bulk-download-zip-creator-prod", // Use the name you gave your Lambda function
        InvocationType: InvocationType.RequestResponse,
        Payload: JSON.stringify({
          sourceBucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
          fileKeys: fileKeys,
          folderStructure: folderStructure,
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
