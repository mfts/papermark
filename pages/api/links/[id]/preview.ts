import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/links/:id/preview
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    // Create a new preview token
    const previewToken = newId("preview");
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 20); // previewToken expires in 20 minutes

    await prisma.verificationToken.create({
      data: {
        token: previewToken,
        identifier: `preview:${id}:${(session.user as CustomUser).id}`,
        expires: expiresAt,
      },
    });

    return res.status(200).json({ previewToken });
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
