import { NextApiRequest, NextApiResponse } from "next";

import { getTeamStorageConfigById } from "@/ee/features/storage/config";
import { InvocationType, InvokeCommand } from "@aws-sdk/client-lambda";
import { ItemType, ViewType } from "@prisma/client";
import slugify from "@sindresorhus/slugify";

import { getLambdaClientForTeam } from "@/lib/files/aws-client";
import { notifyDocumentDownload } from "@/lib/integrations/slack/events";
import prisma from "@/lib/prisma";
import { getIpAddress } from "@/lib/utils/ip";

export const config = {
  maxDuration: 300,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { folderId, dataroomId, viewId, linkId } = req.body as {
      folderId: string;
      dataroomId: string;
      viewId: string;
      linkId: string;
    };
    if (!folderId) {
      return res
        .status(400)
        .json({ error: "folderId is required in request body" });
    }

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
            teamId: true,
            allowDownload: true,
            expiresAt: true,
            isArchived: true,
            enableWatermark: true,
            watermarkConfig: true,
            name: true,
            permissionGroupId: true,
          },
        },
        groupId: true,
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

    // if viewedAt is longer than 23 hours ago, we should not allow the download
    if (
      view.viewedAt &&
      view.viewedAt < new Date(Date.now() - 23 * 60 * 60 * 1000)
    ) {
      return res.status(403).json({ error: "Error downloading" });
    }

    const rootFolder = await prisma.dataroomFolder.findUnique({
      where: {
        id: folderId,
        dataroomId,
      },
      select: { id: true, name: true, path: true },
    });

    if (!rootFolder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    const subfolders = await prisma.dataroomFolder.findMany({
      where: {
        dataroomId,
        path: { startsWith: rootFolder.path + "/" },
      },
      select: { id: true, name: true, path: true },
    });

    let allFolders = [rootFolder, ...subfolders];
    let allDocuments = await prisma.dataroomDocument.findMany({
      where: {
        dataroomId,
        folderId: {
          in: allFolders.map((f) => f.id),
        },
      },
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
                numPages: true,
                contentType: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Check permissions based on groupId (ViewerGroup) or permissionGroupId (PermissionGroup)
    const effectiveGroupId = view.groupId || view.link.permissionGroupId;

    if (effectiveGroupId) {
      let groupPermissions: any[] = [];

      if (view.groupId) {
        // This is a ViewerGroup (legacy behavior)
        groupPermissions = await prisma.viewerGroupAccessControls.findMany({
          where: { groupId: view.groupId, canDownload: true },
        });
      } else if (view.link.permissionGroupId) {
        // This is a PermissionGroup (new behavior)
        groupPermissions = await prisma.permissionGroupAccessControls.findMany({
          where: { groupId: view.link.permissionGroupId, canDownload: true },
        });
      }

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

      allFolders = allFolders.filter((folder) =>
        permittedFolderIds.includes(folder.id),
      );
      allDocuments = allDocuments.filter((doc) =>
        permittedDocumentIds.includes(doc.id),
      );
    }

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

    const addFileToStructure = (
      fullPath: string,
      rootFolder: { name: string; path: string },
      fileName: string,
      fileKey: string,
      fileType?: string,
      numPages?: number,
    ) => {
      let relativePath = "";
      if (fullPath !== rootFolder.path) {
        const pathRegex = new RegExp(`^${rootFolder.path}/(.*)$`);
        const match = fullPath.match(pathRegex);
        relativePath = match ? match[1] : "";
      }

      const pathParts = [slugify(rootFolder.name)];
      if (relativePath) {
        pathParts.push(
          ...relativePath
            .split("/")
            .filter(Boolean)
            .map((part) => slugify(part)),
        );
      }

      let currentPath = "";
      for (const part of pathParts) {
        currentPath += "/" + part;
        if (!folderStructure[currentPath]) {
          folderStructure[currentPath] = {
            name: part,
            path: currentPath,
            files: [],
          };
        }
      }

      if (fileName && fileKey) {
        const needsWatermark =
          view.link.enableWatermark &&
          (fileType === "pdf" || fileType === "image");

        folderStructure[currentPath].files.push({
          name: fileName,
          key: fileKey,
          type: fileType,
          numPages: numPages,
          needsWatermark: needsWatermark ?? undefined,
        });
        fileKeys.push(fileKey);
      }
    };

    for (const folder of allFolders) {
      const docs = allDocuments.filter((doc) => doc.folderId === folder.id);

      if (docs.length === 0) {
        addFileToStructure(
          folder.path,
          rootFolder,
          "",
          "",
          undefined,
          undefined,
        );
        continue;
      }

      for (const doc of docs) {
        const version = doc.document.versions[0];
        if (
          !version ||
          version.type === "notion" ||
          version.storageType === "VERCEL_BLOB"
        )
          continue;

        // Use .file if watermark is enabled and document is PDF, otherwise use .originalFile
        const fileKey =
          view.link.enableWatermark && version.type === "pdf"
            ? version.file
            : (version.originalFile ?? version.file);
        addFileToStructure(
          folder.path,
          rootFolder,
          doc.document.name,
          fileKey,
          version.type ?? undefined,
          version.numPages ?? undefined,
        );
      }
    }

    const rootPath = "/" + slugify(rootFolder.name);
    if (!folderStructure[rootPath]) {
      folderStructure[rootPath] = {
        name: slugify(rootFolder.name),
        path: rootPath,
        files: [],
      };
    }

    if (view.link.teamId) {
      void notifyDocumentDownload({
        teamId: view.link.teamId,
        documentId: undefined,
        dataroomId,
        linkId,
        viewerEmail: view.viewerEmail ?? undefined,
        viewerId: undefined,
        metadata: {
          folderName: rootFolder.name,
          documentCount: allDocuments.length,
          isFolderDownload: true,
        },
      }).catch((error) => {
        console.error("Error sending Slack notification:", error);
      });
    }

    // Get team-specific storage configuration
    const [client, storageConfig] = await Promise.all([
      getLambdaClientForTeam(view.link.teamId!),
      getTeamStorageConfigById(view.link.teamId!),
    ]);

    const params = {
      FunctionName: `bulk-download-zip-creator-${process.env.NODE_ENV === "development" ? "dev" : "prod"}`,
      InvocationType: InvocationType.RequestResponse,
      Payload: JSON.stringify({
        sourceBucket: storageConfig.bucket,
        fileKeys,
        folderStructure,
        watermarkConfig: view.link.enableWatermark
          ? {
              enabled: true,
              config: view.link.watermarkConfig,
              viewerData: {
                email: view.viewerEmail,
                date: new Date(
                  view.viewedAt ? view.viewedAt : new Date(),
                ).toLocaleDateString(),
                time: new Date(
                  view.viewedAt ? view.viewedAt : new Date(),
                ).toLocaleTimeString(),
                link: view.link.name,
                ipAddress: getIpAddress(req.headers),
              },
            }
          : { enabled: false },
      }),
    };

    const command = new InvokeCommand(params);
    const response = await client.send(command);

    if (!response.Payload) throw new Error("Lambda returned empty payload");

    const parsed = JSON.parse(new TextDecoder().decode(response.Payload));
    const { downloadUrl } = JSON.parse(parsed.body);

    res.status(200).json({ downloadUrl });
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
}
