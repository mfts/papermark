import { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { InvocationType, InvokeCommand } from "@aws-sdk/client-lambda";
import { getServerSession } from "next-auth";
import { getLambdaClient } from "@/lib/files/aws-client";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import slugify from "@sindresorhus/slugify";

export const config = {
    maxDuration: 180,
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

    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { folderId } = req.body || {};

        if (!folderId) {
            return res.status(400).json({ error: "folderId is required in the request body" });
        }

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

        const targetFolder = await prisma.dataroomFolder.findUnique({
            where: {
                id: folderId,
                dataroom: {
                    id: dataroomId,
                    teamId: teamId,
                },
            },
            select: {
                id: true,
                name: true,
                path: true,
            },
        });

        if (!targetFolder) {
            return res.status(404).end("Folder not found");
        }

        const subfolders = await prisma.dataroomFolder.findMany({
            where: {
                dataroomId: dataroomId,
                path: {
                    startsWith: targetFolder.path + '/',
                },
            },
            select: {
                id: true,
                name: true,
                path: true,
            },
        });

        const downloadFolders = [targetFolder, ...subfolders];

        const downloadDocuments = await prisma.dataroomDocument.findMany({
            where: {
                dataroomId: dataroomId,
                OR: [
                    { folderId: folderId },
                    {
                        folderId: {
                            in: downloadFolders.map(folder => folder.id),
                        },
                    },
                ],
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
                                contentType: true,
                            },
                            take: 1,
                        },
                    },
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

        const folderMap = new Map(
            downloadFolders.map((folder) => [
                folder.path,
                { name: folder.name, id: folder.id },
            ]),
        );

        const basePath = targetFolder.path;
        const rootFolderName = targetFolder.name;

        const getRelativePath = (fullPath: string): string => {
            if (fullPath === basePath) return `/${slugify(rootFolderName)}`;
            const relative = fullPath.replace(basePath, "");
            const suffix = relative.startsWith("/") ? relative : "/" + relative;
            return `/${slugify(rootFolderName)}${suffix}`;
        };

        const addFileToStructure = (
            fullPath: string,
            fileName: string,
            fileKey: string,
        ) => {
            const relativePath = getRelativePath(fullPath);
            const pathParts = relativePath.split("/").filter(Boolean);
            let currentPath = "";

            pathParts.forEach((part) => {
                currentPath += "/" + part;
                const absoluteFullPath = basePath + currentPath.replace(`/${slugify(rootFolderName)}`, "");
                const folderInfo = folderMap.get(absoluteFullPath);
                if (!folderStructure[currentPath]) {
                    folderStructure[currentPath] = {
                        name: folderInfo ? folderInfo.name : part,
                        path: currentPath,
                        files: [],
                    };
                }
            });

            if (fileName && fileKey) {
                folderStructure[relativePath].files.push({ name: fileName, key: fileKey });
                fileKeys.push(fileKey);
            }
        };

        downloadFolders.forEach((folder) => {
            const folderDocs = downloadDocuments
                .filter((doc) => doc.folderId === folder.id)
                .filter((doc) => doc.document.versions[0].type !== "notion")
                .filter((doc) => doc.document.versions[0].storageType !== "VERCEL_BLOB");

            folderDocs.forEach((doc) =>
                addFileToStructure(
                    folder.path,
                    doc.document.name,
                    doc.document.versions[0].originalFile ?? doc.document.versions[0].file,
                )
            );

            if (folderDocs.length === 0) {
                addFileToStructure(folder.path, "", "");
            }
        });

        const rootPath = `/${slugify(rootFolderName)}`;
        if (!folderStructure[rootPath]) {
            folderStructure[rootPath] = {
                name: slugify(rootFolderName),
                path: rootPath,
                files: [],
            };
        }

        const client = getLambdaClient();
        const params = {
            FunctionName: `bulk-download-zip-creator-${process.env.NODE_ENV === "development" ? "dev" : "prod"}`,
            InvocationType: InvocationType.RequestResponse,
            Payload: JSON.stringify({
                sourceBucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
                fileKeys: fileKeys,
                folderStructure: folderStructure,
            }),
        };

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
        return res.status(500).json({
            message: "Internal Server Error",
            error: (error as Error).message,
        });
    }
}
