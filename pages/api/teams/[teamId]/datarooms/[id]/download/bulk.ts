import { NextApiRequest, NextApiResponse } from "next";

import { getTeamStorageConfigById } from "@/ee/features/storage/config";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { InvocationType, InvokeCommand } from "@aws-sdk/client-lambda";
import { getServerSession } from "next-auth";

import { getLambdaClientForTeam } from "@/lib/files/aws-client";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export const config = {
  maxDuration: 300,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId, id: dataroomId } = req.query as {
    teamId: string;
    id: string;
  };

  if (req.method === "POST") {
    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: (session.user as CustomUser).id,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!team) {
        return res.status(403).end("Unauthorized to access this team");
      }

      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
        },
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
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
      if (!dataroom) {
        return res.status(404).end("Dataroom not found");
      }
      let downloadFolders = dataroom.folders;
      let downloadDocuments = dataroom.documents;

      // Construct folderStructure and fileKeys
      const folderStructure: {
        [key: string]: {
          name: string;
          path: string;
          files: { name: string; key: string }[];
        };
      } = {};
      const fileKeys: string[] = [];
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
          const folderInfo = folderMap.get(path) || {
            name: "Root",
            id: null,
          };
          folderStructure[path] = {
            name: folderInfo.name,
            path: path,
            files: [],
          };
        }
        folderStructure[path].files.push({ name: fileName, key: fileKey });
        fileKeys.push(fileKey);
      };
      downloadDocuments
        .filter((doc) => !doc.folderId)
        .filter((doc) => doc.document.versions[0].type !== "notion")
        .filter((doc) => doc.document.versions[0].storageType !== "VERCEL_BLOB")
        .forEach((doc) =>
          addFileToStructure(
            "/",
            doc.document.name,
            doc.document.versions[0].originalFile ??
              doc.document.versions[0].file,
          ),
        );
      downloadFolders.forEach((folder) => {
        const folderDocs = downloadDocuments
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
              doc.document.versions[0].originalFile ??
                doc.document.versions[0].file,
            ),
          );

        // If the folder is empty, ensure it's still added to the structure
        if (folderDocs && folderDocs.length === 0) {
          addFileToStructure(folder.path, "", "");
        }
      });

      // Get team-specific Lambda client and storage config
      const client = await getLambdaClientForTeam(teamId);
      const storageConfig = await getTeamStorageConfigById(teamId);

      const params = {
        FunctionName: storageConfig.lambdaFunctionName,
        InvocationType: InvocationType.RequestResponse,
        Payload: JSON.stringify({
          sourceBucket: storageConfig.bucket,
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
