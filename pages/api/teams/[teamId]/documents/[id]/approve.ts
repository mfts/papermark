import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { teamId, id: documentId } = req.query as { teamId: string; id: string };

    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        // Verify user session
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if user is part of the team
        const team = await prisma.team.findUnique({
            where: { id: teamId as string },
            select: { id: true },
        });

        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user?.email as string },
            select: { id: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check if the document exists
        const document = await prisma.document.findUnique({
            where: { id: documentId, teamId: teamId },
            select: { id: true, uploadedDocument: { select: { id: true, requireApproval: true } } },
        });

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }
        if (!document.uploadedDocument?.requireApproval) {
            return res.status(400).json({ message: "Document is not pending approval" });
        }

        // Update documentUpload to mark it as approved
        await prisma.documentUpload.update({
            where: { id: document.uploadedDocument?.id, teamId: teamId },
            data: {
                requireApproval: false,
                approvedAt: new Date(),
                approvedBy: user.id,
                approvedStatus: "APPROVED",
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error approving document:", error);
        return res.status(500).json({ message: "Error approving document" });
    }
}

