import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hashPassword } from "@/lib/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { documentId, password, expiresAt, ...linkData } = req.body;

    const hashedPassword = password && password.length > 0 ? await hashPassword(password) : null
    const exat = expiresAt ? new Date(expiresAt) : null

    // Fetch the link and its related document from the database
    const link = await prisma.link.create({
      data: {
        documentId: documentId,
        password: hashedPassword,
        name: linkData.name || null,
        emailProtected: linkData.emailProtected,
        expiresAt: exat
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
