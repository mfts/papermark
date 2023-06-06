import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { documentId } = req.body;

    // Fetch the link and its related document from the database
    const link = await prisma.link.create({
      data: {
        documentId: documentId,
      },
    });

    const linkWithView = {
      ...link,
      _count: { views: 0 },
      views: [],
    };

    if (!linkWithView) {
      return res.status(404).json({ error: "Link not found" });
    }

    return res.status(200).json(linkWithView);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
