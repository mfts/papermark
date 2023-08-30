import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // POST /api/links/savedLinks
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    try {
      // Check if the link is already saved by the user
      const savedLinks = await prisma.savedLink.findMany({
        where: {
          userId: (session.user as CustomUser).id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          link: {
            select: {
              id: true,
              name: true,
              document: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return res.status(200).json(savedLinks);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "An error occurred while saving the link" });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
