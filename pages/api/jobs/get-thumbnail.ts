import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import { getFileForDocumentPage } from "@/lib/documents/get-file-helper";
import { ratelimit } from "@/lib/redis";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { success } = await ratelimit(150, "1 m").limit(
    `get-thumbnail:${(session.user as CustomUser).id}`,
  );
  if (!success) {
    return res.status(429).json({ message: "Too many requests" });
  }

  const { documentId, pageNumber, versionNumber } = req.query as {
    documentId: string;
    pageNumber: string;
    versionNumber: string;
  };

  try {
    const imageUrl = await getFileForDocumentPage(
      Number(pageNumber),
      documentId,
      versionNumber === "undefined" ? undefined : Number(versionNumber),
    );

    return res.status(200).json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
    return;
  }
}
