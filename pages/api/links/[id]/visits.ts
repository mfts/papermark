import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { log } from "@/lib/utils";
import { getViewPageDuration } from "@/lib/tinybird";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/links/:id/visits
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // get link id from query params
    const { id } = req.query as { id: string };

    try {
      // get the numPages from document
      const result = await prisma.link.findUnique({
        where: {
          id: id,
        },
        select: {
          document: {
            select: {
              numPages: true,
            },
          },
        },
      });
      const numPages = result?.document?.numPages;

      const views = await prisma.view.findMany({
        where: {
          linkId: id,
        },
        orderBy: {
          viewedAt: "desc",
        },
      });

      const durationsPromises = views.map((view) => {
        return getViewPageDuration({
          documentId: view.documentId,
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
        const completionRate = numPages ? (durations[index].data.length / numPages) * 100 : 0;
        
        return {
          ...view,
          duration: durations[index],
          totalDuration: summedDurations[index],
          completionRate: completionRate.toFixed(),
        }
      });

      // TODO: Check that the user is owner of the links, otherwise return 401

      // console.log("viewsWithDuration:", viewsWithDuration)

      res.status(200).json(viewsWithDuration);
    } catch (error) {
      log(`Failed to get views for link ${id}. Error: \n\n ${error}`);
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
