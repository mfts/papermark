import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
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

      // Create the agreement content as a formatted text file
      const agreementContent = `
AGREEMENT DETAILS
================

Name: ${agreement.name}
URL: ${agreement.content}
Requires Name: ${agreement.requireName ? "Yes" : "No"}
Created: ${agreement.createdAt.toLocaleDateString()} at ${agreement.createdAt.toLocaleTimeString()}
Last Updated: ${agreement.updatedAt.toLocaleDateString()} at ${agreement.updatedAt.toLocaleTimeString()}
Team: ${team.name}

USAGE STATISTICS
===============

Used in ${agreement._count.links} link${agreement._count.links === 1 ? "" : "s"}
Total responses: ${agreement._count.responses}

AGREEMENT URL
=============

${agreement.content}

---
Downloaded on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
Agreement ID: ${agreement.id}
      `.trim();

      // Set headers for file download
      const filename = `${agreement.name.replace(/[^a-z0-9\-_]/gi, '_').toLowerCase().substring(0, 50)}_agreement.txt`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", Buffer.byteLength(agreementContent, 'utf8'));

      // Send the agreement content
      return res.send(agreementContent);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}