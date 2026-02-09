import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import {
  generateTestPageViews,
  TEST_VIEWERS,
} from "@/lib/test-views/generate-test-view";
import { CustomUser } from "@/lib/types";

import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId, id: documentId } = req.query as {
    teamId: string;
    id: string;
  };
  const userId = (session.user as CustomUser).id;

  // Verify user belongs to team
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      users: {
        some: {
          userId,
        },
      },
    },
    select: { id: true },
  });

  if (!team) {
    return res.status(401).end("Unauthorized");
  }

  if (req.method === "POST") {
    // Create test view for this document
    try {
      // Get document with its primary version and first link
      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
          teamId,
        },
        select: {
          id: true,
          numPages: true,
          links: {
            take: 1,
            orderBy: { createdAt: "asc" },
            select: { id: true },
          },
          versions: {
            where: { isPrimary: true },
            take: 1,
            select: {
              versionNumber: true,
              numPages: true,
            },
          },
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (document.links.length === 0) {
        return res.status(400).json({
          error: "Document has no links. Please create a link first.",
        });
      }

      const linkId = document.links[0].id;
      const numPages =
        document.versions[0]?.numPages || document.numPages || 1;
      const versionNumber = document.versions[0]?.versionNumber || 1;

      // Create test views for all test viewers with different completion rates
      // Iuliia (first viewer) gets ~60%, Marc (second viewer) gets 100%
      const completionRates = [60, 100];
      const createdViews = [];
      
      for (let i = 0; i < TEST_VIEWERS.length; i++) {
        const testViewer = TEST_VIEWERS[i];
        const completionPercentage = completionRates[i] || 100;
        
        // Create view record in the database
        const view = await prisma.view.create({
          data: {
            linkId,
            documentId,
            viewerEmail: testViewer.email,
            viewerName: testViewer.name,
            verified: true,
            teamId,
          },
          select: { id: true },
        });

        // Generate page view events in Tinybird with completion percentage
        await generateTestPageViews({
          viewId: view.id,
          linkId,
          documentId,
          numPages,
          versionNumber,
          completionPercentage,
        });

        createdViews.push({
          viewId: view.id,
          viewerEmail: testViewer.email,
        });
      }

      return res.status(201).json({
        message: "You got your first views!",
        views: createdViews,
      });
    } catch (error) {
      console.error("Error creating test view:", error);
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // Delete test views for this document (all test viewers)
    try {
      const testEmails = TEST_VIEWERS.map((v) => v.email);
      const result = await prisma.view.deleteMany({
        where: {
          documentId,
          viewerEmail: {
            in: testEmails,
          },
        },
      });

      return res.status(200).json({
        message: "Test views deleted successfully",
        deletedCount: result.count,
      });
    } catch (error) {
      console.error("Error deleting test views:", error);
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
