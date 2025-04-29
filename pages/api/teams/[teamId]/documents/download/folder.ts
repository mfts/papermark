import { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { getLambdaClient } from "@/lib/files/aws-client";
import { InvokeCommand, InvocationType } from "@aws-sdk/client-lambda";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import slugify from "@sindresorhus/slugify";

export const config = { maxDuration: 180 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).end("Unauthorized");

    const { teamId } = req.query as { teamId: string };
    // api/teams/[teamId]/documents/download/folder
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { folderIds } = req.body as { folderIds: string[] };

        if (!Array.isArray(folderIds) || folderIds.length === 0) {
            return res.status(400).json({ error: "folderIds (array) is required in request body" });
        }

        const userId = (session.user as CustomUser).id;

        const team = await prisma.team.findUnique({
            where: {
                id: teamId,
                users: {
                    some: { userId },
                },
            },
            select: { id: true },
        });

        if (!team) return res.status(403).end("Unauthorized to access this team");

        const rootFolders = await prisma.folder.findMany({
            where: {
                id: { in: folderIds },
                teamId,
            },
            select: { id: true, name: true, path: true },
        });

        if (rootFolders.length === 0) {
            return res.status(404).json({ error: "No valid folders found" });
        }

        const subfolders = await prisma.folder.findMany({
            where: {
                teamId,
                OR: rootFolders.map((f) => ({
                    path: {
                        startsWith: f.path + "/",
                    },
                })),
            },
            select: {
                id: true,
                name: true,
                path: true,
            },
        });

        const allFolders = [...rootFolders, ...subfolders];
        const folderMap = new Map(allFolders.map((f) => [f.path, { name: f.name, id: f.id }]));

        const allDocuments = await prisma.document.findMany({
            where: {
                teamId,
                folderId: {
                    in: allFolders.map((f) => f.id),
                },
            },
            select: {
                id: true,
                folderId: true,
                name: true,
                versions: {
                    where: { isPrimary: true },
                    select: {
                        type: true,
                        file: true,
                        originalFile: true,
                        storageType: true,
                    },
                    take: 1,
                },
            },
        });

        const folderStructure: {
            [key: string]: {
                name: string;
                path: string;
                files: { name: string; key: string }[];
            };
        } = {};

        const fileKeys: string[] = [];

        const addFileToStructure = (
            fullPath: string,
            rootFolder: { name: string; path: string },
            fileName: string,
            fileKey: string,
        ) => {
            const relativePath = fullPath === rootFolder.path
                ? ""
                : fullPath.replace(rootFolder.path + "/", "");

            const pathParts = [slugify(rootFolder.name), ...relativePath.split("/").filter(Boolean)];
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
                folderStructure[currentPath].files.push({ name: fileName, key: fileKey });
                fileKeys.push(fileKey);
            }
        };

        for (const folder of allFolders) {
            const rootFolder = rootFolders.find((root) => folder.path.startsWith(root.path));
            if (!rootFolder) continue;

            const docs = allDocuments.filter((doc) => doc.folderId === folder.id);

            if (docs.length === 0) {
                addFileToStructure(folder.path, rootFolder, "", "");
                continue;
            }

            for (const doc of docs) {
                const version = doc.versions[0];
                if (!version || version.type === "notion" || version.storageType === "VERCEL_BLOB") continue;

                const fileKey = version.originalFile ?? version.file;
                addFileToStructure(folder.path, rootFolder, doc.name, fileKey);
            }
        }

        const client = getLambdaClient();
        const lambdaPayload = {
            sourceBucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
            fileKeys,
            folderStructure,
        };

        const command = new InvokeCommand({
            FunctionName: `bulk-download-zip-creator-${process.env.NODE_ENV === "development" ? "dev" : "prod"}`,
            InvocationType: InvocationType.RequestResponse,
            Payload: JSON.stringify(lambdaPayload),
        });

        const lambdaResponse = await client.send(command);

        if (!lambdaResponse.Payload) throw new Error("Empty Lambda response");

        const parsed = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));
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
