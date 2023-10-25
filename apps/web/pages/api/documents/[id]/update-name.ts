import { NextApiRequest, NextApiResponse } from "next";
import prisma from "database";
import { getServerSession } from "next-auth/next";
import { CustomUser } from "@/lib/types";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // GET /api/documents/:id/update-name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: id,
        },
        select: {
          ownerId: true,
        },
      });

      // Check if the user is the owner of the document
      if (document?.ownerId !== (session.user as CustomUser).id) {
        return res.status(401).end("Unauthorized");
      }

      await prisma.document.update({
        where: {
          id: id,
        },
        data: {
          name: req.body.name,
        },
      });

      res.status(200).json({ message: "Document name updated!" });
    } catch (error) {
      return res.status(500).json({
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
