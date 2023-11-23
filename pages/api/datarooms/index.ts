import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/datarooms/paged
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    try {
      const pagedDatarooms = await prisma.dataroom.findMany({
        where: {
          ownerId: (session.user as CustomUser).id,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          documentsIds: true
        }
      })

      const hierarchicalDatarooms = await prisma.hierarchicalDataroom.findMany({
        where: {
          ownerId: (session.user as CustomUser).id
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select:{
              files: true
            }
          }
        }
      })

      const homePages = await prisma.dataroomFolder.findMany({
        where: {
          parentFolderId: null
        }
      })

      res.status(200).json({ pagedDatarooms, hierarchicalDatarooms, homePages });
    } catch (error) {
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