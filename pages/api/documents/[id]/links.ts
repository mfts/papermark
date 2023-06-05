import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getExtension } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/documents/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end({ error: "Unauthorized" });
    }

    const { id } = req.query as { id: string };

    try {
      const links = await prisma.link.findMany({
        where: {
          documentId: id,
        },
        include: {
          views: true,
          _count: {
            select: { views: true },
          },
        },
      });

      // TODO: Check that the user is owner of the document, otherwise return 401

      res.status(200).json(links);
    } catch (error) {
      return res.status(500).end({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
