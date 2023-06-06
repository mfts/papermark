import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/links/:id
    const { id } = req.query as { id: string };

    try {
      const link = await prisma.link.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          document: { select: { id: true, name: true, file: true } },
        },
      });

      res.status(200).json(link);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
