import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { hashPassword } from "@/lib/utils";
import { authOptions } from "../../auth/[...nextauth]";

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
  } 
  
  if (req.method === "PUT") {
    // PUT /api/links/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };
    const { documentId, password, expiresAt, ...linkData } = req.body;

    const hashedPassword =
      password && password.length > 0 ? await hashPassword(password) : null;
    const exat = expiresAt ? new Date(expiresAt) : null;

    // Update the link in the database
    const updatedLink = await prisma.link.update({
      where: { id: id },
      data: {
        documentId: documentId,
        password: hashedPassword,
        name: linkData.name || null,
        emailProtected: linkData.emailProtected || false,
        expiresAt: exat,
      },
      include: {
        views: {
          orderBy: {
            viewedAt: "desc",
          }
        },
        _count: {
          select: { views: true },
        },
      },
    });
    
    if (!updatedLink) {
      return res.status(404).json({ error: "Link not found" });
    }

    return res.status(200).json(updatedLink);
  }

  // We only allow GET and PUT requests
  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
