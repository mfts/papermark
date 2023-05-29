import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { linkId, email, documentId } = req.body;

  try {
    await prisma.view.create({
      data: {
        linkId: linkId,
        viewerEmail: email,
        documentId: documentId,
      },
    });

    res.status(200).json({ message: "View recorded" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}
