import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { isValidUrl } from "@/lib/utils";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "PUT") {
        // PUT /api/teams/:teamId/documents/:id/update-urls
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).end("Unauthorized");
        }

        const { teamId, id: documentId } = req.query as { teamId: string; id: string };
        const { contentUrls } = req.body as { contentUrls: string[] };

        const userId = (session.user as CustomUser).id;

        try {
            // Verify user has access to the document
            const { document } = await getTeamWithUsersAndDocument({
                teamId,
                userId,
                docId: documentId,
            });

            if (!document) {
                return res.status(404).json({
                    error: "Document not found",
                });
            }

            // Check if document is a URL type
            if (document.type !== "urls") {
                return res.status(400).json({
                    error: "This endpoint is only for URL-type documents",
                });
            }

            // Validate URLs
            const validUrls = contentUrls.filter((url) => isValidUrl(url.trim()));
            if (validUrls.length !== contentUrls.length) {
                return res.status(400).json({
                    error: "One or more URLs are invalid",
                });
            }

            if (validUrls.length === 0) {
                return res.status(400).json({
                    error: "At least one valid URL is required",
                });
            }

            // Update document and its primary version
            await prisma.$transaction(async (tx) => {
                // Update document
                await tx.document.update({
                    where: { id: documentId },
                    data: {
                        contentUrls: validUrls,
                        file: validUrls[0], // Set the first URL as the primary file
                    },
                });

                // Update the primary document version
                await tx.documentVersion.updateMany({
                    where: {
                        documentId: documentId,
                        isPrimary: true,
                    },
                    data: {
                        contentUrls: validUrls,
                        file: validUrls[0], // Set the first URL as the primary file
                    },
                });
            });


            try {
                await fetch(
                    `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
                );
            } catch (revalidateError) {
                console.error("Failed to revalidate document:", revalidateError);
            }

            return res.status(200).json({
                message: "Document URLs updated successfully",
                contentUrls: validUrls,
            });
        } catch (error) {
            errorhandler(error, res);
        }
    } else {
        // We only allow PUT requests
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 