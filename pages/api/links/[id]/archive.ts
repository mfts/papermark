import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PUT") {
    // PUT /api/links/:id/archive
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    const { isArchived } = req.body;

    try {
      // Update the link in the database
      const updatedLink = await prisma.link.update({
        where: { id: id },
        data: {
          isArchived: isArchived,
        },
        include: {
          views: {
            orderBy: {
              viewedAt: "desc",
            },
          },
          _count: {
            select: { views: true },
          },
        },
      });

      if (!updatedLink) {
        return res.status(404).json({ error: "Link not found" });
      }

      await fetch(
        `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&linkId=${id}&hasDomain=${updatedLink.domainId ? "true" : "false"}`,
      );

      return res.status(200).json(updatedLink);
    } catch (error) {
      errorhandler(error, res);
    }
  }

  // We only allow PUT requests
  res.setHeader("Allow", ["PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}