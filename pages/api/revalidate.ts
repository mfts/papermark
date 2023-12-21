import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const { linkId, documentId } = req.query as {
    linkId: string;
    documentId: string;
  };

  try {
    if (linkId) {
      // revalidate this link
      await res.revalidate(`/view/${linkId}`);
    }

    if (documentId) {
      // revalidate all links for this document
      const links = await prisma.link.findMany({
        where: {
          documentId: documentId,
          domainId: null,
        },
        select: { id: true },
      });
      for (const link of links) {
        await res.revalidate(`/view/${link.id}`);
      }
    }

    return res.json({ revalidated: true });
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    console.error("Error during revalidation:", err);
    return res.status(500).send("Error revalidating");
  }
}
