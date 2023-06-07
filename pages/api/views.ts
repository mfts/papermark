import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

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
    log(`Failed to record view for ${linkId}. Error: \n\n ${error}`)
    res.status(500).json({ message: (error as Error).message });
  }
}
