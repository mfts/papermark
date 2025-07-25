import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { LIMITS } from "@/lib/constants";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { getDocumentWithTeamAndUser } from "@/lib/team/helper";
import { getViewPageDuration } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { id } = req.query as { id: string };
  const userId = (session.user as CustomUser).id;

  try {
    const result = await prisma.link.findUnique({
      where: { id },
      select: {
        document: {
          select: {
            id: true,
            type: true,
            numPages: true,
            versions: {
              where: { isPrimary: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { numPages: true },
            },
            team: {
              select: {
                id: true,
                plan: true,
                users: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const document = result?.document;

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docId = document.id;

    // ✅ Ensure user belongs to the document’s team
    await getDocumentWithTeamAndUser({
      docId,
      userId,
      options: {
        team: {
          select: {
            users: {
              select: { userId: true },
            },
          },
        },
      },
    });

    const numPages =
      document.versions?.[0]?.numPages || document.numPages || 0;

    const views = await prisma.view.findMany({
      where: { linkId: id },
      orderBy: { viewedAt: "desc" },
    });

    const limitedViews =
      document.team?.plan === "free" ? views.slice(0, LIMITS.views) : views;

    const isLinkType = document.type === "link";

    const viewsWithDuration = await Promise.all(
      limitedViews.map(async (view) => {
        if (isLinkType) {
          return {
            ...view,
            duration: { data: [] },
            totalDuration: 0,
            completionRate: "100",
          };
        }

        const duration = await getViewPageDuration({
          documentId: view.documentId!,
          viewId: view.id,
          since: 0,
        });

        const totalDuration = duration.data.reduce(
          (totalDuration, d) => totalDuration + d.sum_duration,
          0,
        );

        const completionRate = numPages
          ? ((duration.data.length / numPages) * 100).toFixed()
          : "0";

        return {
          ...view,
          duration,
          totalDuration,
          completionRate,
        };
      }),
    );

    return res.status(200).json(viewsWithDuration);
  } catch (error) {
    log({
      message: `Failed to get views for link: _${id}_. \n\n ${error} \n\n*Metadata*: \`{userId: ${userId}}\``,
      type: "error",
    });
    errorhandler(error, res);
  }
}
