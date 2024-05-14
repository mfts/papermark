import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import { getFileForDocumentPage } from "@/lib/documents/get-file-helper";

import { authOptions } from "../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { documentId, pageNumber } = req.query as {
    documentId: string;
    pageNumber: string;
  };

  try {
    const imageUrl = await getFileForDocumentPage(
      Number(pageNumber),
      documentId,
    );

    return res.status(200).json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
    return;
  }
}
