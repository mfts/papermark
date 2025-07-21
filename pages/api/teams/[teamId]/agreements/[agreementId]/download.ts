import { NextApiRequest, NextApiResponse } from "next";

import { DocumentStorageType } from "@prisma/client";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/agreements/:agreementId/download
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId, agreementId } = req.query as { teamId: string; agreementId: string };

    if (!teamId || !agreementId) {
      return res.status(400).json("Missing required parameters");
    }

    try {
      // Check if user belongs to the team and get the agreement
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          agreements: {
            where: {
              id: agreementId,
              deletedAt: null, // Only allow downloading non-deleted agreements
            },
            select: {
              id: true,
              name: true,
              content: true,
              requireName: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  links: true,
                  responses: true,
                },
              },
            },
          },
        },
      });

      if (!team || team.agreements.length === 0) {
        return res.status(404).json("Agreement not found or unauthorized");
      }

      const agreement = team.agreements[0];

      // Get the file URL from S3
      const fileUrl = await getFile({
        type: DocumentStorageType.S3_PATH, // Assuming agreements use S3 storage
        data: agreement.content, // S3 file key
        isDownload: true,
      });

      // Fetch the actual file content from S3
      const fileResponse = await fetch(fileUrl);
      
      if (!fileResponse.ok) {
        throw new Error("Failed to fetch agreement file content");
      }

      const fileContent = await fileResponse.text();

      // Set headers for file download
      const filename = `${agreement.name.replace(/[^a-z0-9\-_]/gi, '_').toLowerCase().substring(0, 50)}_agreement.txt`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", Buffer.byteLength(fileContent, 'utf8'));

      // Send the actual agreement file content
      return res.send(fileContent);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}