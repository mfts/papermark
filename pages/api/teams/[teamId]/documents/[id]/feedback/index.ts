import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { errorhandler } from "@/lib/errorHandler";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id/feedback
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: documentId } = req.query as {
      teamId: string;
      id: string;
    };
    const userId = (session.user as CustomUser).id;

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
          teamId: teamId,
          team: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
      });
      if (!document) {
        return res.status(404).json({ message: "Not found" });
      }
    } catch (error) {
      return errorhandler(error, res);
    }

    try {
      const feedback = await prisma.feedback.findUnique({
        where: { documentId },
      });

      return res.status(200).json(feedback);
    } catch (error) {
      return errorhandler(error, res);
    }
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/document/:id/feedback
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }
    const userId = (session.user as CustomUser).id;
    const { teamId, id: documentId } = req.query as {
      teamId: string;
      id: string;
    };
    const { questionText, enabled } = req.body as {
      questionText?: string;
      enabled?: boolean;
    };

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
          teamId: teamId,
          team: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        },
      });
      if (!document) {
        return res.status(404).json({ message: "Not found" });
      }
    } catch (error) {
      return errorhandler(error, res);
    }

    // construct the feedback object
    const feedbackJsonPayload = {
      question: questionText,
      type: "YES_NO",
    };

    try {
      // get the feedback object
      let feedback: { id: string } | null = await prisma.feedback.findUnique({
        where: { documentId },
        select: { id: true },
      });

      // if feedback object does not exist, create it
      if (!feedback) {
        feedback = await prisma.feedback.create({
          data: {
            documentId,
            data: feedbackJsonPayload,
          },
        });
      } else {
        feedback = await prisma.feedback.update({
          where: {
            id: feedback.id,
          },
          data: {
            ...(questionText && { data: feedbackJsonPayload }),
            ...(enabled !== undefined && { enabled: enabled }),
          },
        });
      }

      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
      );

      return res.status(200).json({
        message: "Success",
      });
    } catch (error) {
      return errorhandler(error, res);
    }
  } else {
    // We only allow GET, PUT and DELETE requests
    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
