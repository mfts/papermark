import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).end("Unauthorized");
    }

    const { teamId, id: documentId, versionId } = req.query as {
        teamId: string;
        id: string;
        versionId: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
        const { team, document } = await getTeamWithUsersAndDocument({
            teamId,
            userId,
            docId: documentId,
            checkOwner: false,
            options: {
                select: {
                    id: true,
                    name: true,
                    advancedExcelEnabled: true,
                    versions: {
                        select: {
                            numPages: true,
                            id: true,
                            versionNumber: true,
                            isPrimary: true,
                            hasPages: true,
                            file: true,
                            originalFile: true,
                            storageType: true,
                            type: true,
                            contentType: true,
                            fileSize: true,
                            createdAt: true,
                        },
                    },
                },
            },
        });

        console.log("document+++++", document);

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        // Check if user is admin or manager
        const userTeam = await prisma.userTeam.findUnique({
            where: {
                userId_teamId: {
                    userId,
                    teamId,
                },
            },
            select: { role: true },
        });

        if (!userTeam || (userTeam.role !== "ADMIN" && userTeam.role !== "MANAGER")) {
            return res.status(403).json({
                message: "Only admin and manager users can manage document versions"
            });
        }

        // Find the specific version
        const version = document?.versions?.find(v => v.id === versionId);
        if (!version) {
            return res.status(404).json({ message: "Document version not found" });
        }

        if (req.method === "DELETE") {
            // DELETE /api/teams/:teamId/documents/:id/versions/:versionId

            // Prevent deletion of primary version
            if (version.isPrimary) {
                return res.status(400).json({
                    message: "Cannot delete the primary version. Promote another version to primary first."
                });
            }

            // Prevent deletion if it's the only version
            if (document?.versions?.length === 1) {
                return res.status(400).json({
                    message: "Cannot delete the only version of the document"
                });
            }

            await prisma.documentVersion.delete({
                where: { id: versionId },
            });

            log({
                message: `Document version ${version.versionNumber} deleted for document: ${documentId}`,
                type: "info",
                mention: true,
            });

            return res.status(200).json({
                message: "Document version deleted successfully"
            });

        } else if (req.method === "PUT") {
            // PUT /api/teams/:teamId/documents/:id/versions/:versionId?action=promote
            const { action } = req.body as { action: "promote" };

            if (action === "promote") {
                await prisma.$transaction(async (tx) => {
                    // Set all versions to non-primary
                    await tx.documentVersion.updateMany({
                        where: { documentId },
                        data: { isPrimary: false },
                    });

                    // Set this version as primary
                    await tx.documentVersion.update({
                        where: { id: versionId },
                        data: { isPrimary: true },
                    });

                    // TODO: recheck this
                    // // Update the main document fields to match the new primary version
                    // await tx.document.update({
                    //     where: { id: documentId },
                    //     data: {
                    //         file: version.file,
                    //         type: version.type,
                    //         numPages: version.type === "sheet" ? 1 : version.numPages,
                    //     },
                    // });
                });

                log({
                    message: `Document version ${version.versionNumber} promoted to primary for document: ${documentId}`,
                    type: "info",
                    mention: true,
                });

                return res.status(200).json({
                    message: "Document version promoted to primary successfully"
                });
            }

            return res.status(400).json({ message: "Invalid action" });

        } else if (req.method === "GET") {
            // GET /api/teams/:teamId/documents/:id/versions/:versionId
            const { download } = req.query;

            if (download === "true") {
                // Download the document version
                try {
                    const fileUrl = await getFile({
                        type: version.storageType,
                        data: version.originalFile || version.file,
                        isDownload: true,
                    });

                    return res.status(200).json({
                        downloadUrl: fileUrl,
                        fileName: `${document?.name}_v${version.versionNumber}`,
                        contentType: version.contentType,
                        fileSize: version.fileSize,
                    });
                } catch (error) {
                    log({
                        message: `Failed to generate download URL for version ${versionId}: ${error}`,
                        type: "error",
                    });
                    return res.status(500).json({
                        message: "Failed to generate download URL"
                    });
                }
            }

            // Return version details
            return res.status(200).json(version);

        } else {
            res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }

    } catch (error) {
        log({
            message: `Failed to handle version operation for document: ${documentId}, version: ${versionId}. Error: ${error}`,
            type: "error",
        });
        return res.status(500).json({
            message: "Internal Server Error",
            error: (error as Error).message,
        });
    }
} 