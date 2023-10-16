import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { getViewPageDuration } from "@/lib/tinybird";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id/views
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // get document id and teamId from query params

    const { teamId, id: docId } = req.query as { teamId: string; id: string };

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          users: {
            select: {
              userId: true,
            },
          },
          documents: {
            select: {
              id: true,
              ownerId: true,
              numPages: true,
              versions: {
                where: { isPrimary: true },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { numPages: true },
              },
              views: {
                orderBy: {
                  viewedAt: "desc",
                },
                include: {
                  link: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // check if the team exists
      if (!team) {
        res.status(400).end("Team doesn't exists");
      }

      // check if the user is part the team
      const teamHasUser = team?.users.some((user) => user.userId === userId);
      if (!teamHasUser) {
        res.status(401).end("You are not a member of the team");
      }

      // check if the document exists in the team
      const document = team?.documents.find((doc) => doc.id === docId);
      if (!document) {
        return res.status(400).end("Document doesn't exists in the team");
      }

      // Check that the user is owner of the document, otherwise return 401
      const isUserOwnerOfDocument = document.ownerId === userId;
      if (!isUserOwnerOfDocument) {
        return res.status(401).end("Unauthorized access to the document");
      }

      // get the numPages from document
      const numPages =
        document?.versions[0]?.numPages || document?.numPages || 0;

      const views = document.views;

      const durationsPromises = views.map((view) => {
        return getViewPageDuration({
          documentId: docId,
          viewId: view.id,
          since: 0,
        });
      });

      const durations = await Promise.all(durationsPromises);

      // Sum up durations for each view
      const summedDurations = durations.map((duration) => {
        return duration.data.reduce(
          (totalDuration, data) => totalDuration + data.sum_duration,
          0
        );
      });

      // Construct the response combining views and their respective durations
      const viewsWithDuration = views.map((view, index) => {
        // calculate the completion rate
        const completionRate = numPages
          ? (durations[index].data.length / numPages) * 100
          : 0;

        return {
          ...view,
          duration: durations[index],
          totalDuration: summedDurations[index],
          completionRate: completionRate.toFixed(),
        };
      });

      // console.log("viewsWithDuration:", viewsWithDuration)

      res.status(200).json(viewsWithDuration);
    } catch (error) {
      log(`Failed to get views for link ${docId}. Error: \n\n ${error}`);
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
