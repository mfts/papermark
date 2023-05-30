import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "./auth/[...nextauth]";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Assuming data is an object with `name` and `description` properties
  const { name, url, description } = req.body;

  // You could perform some validation here

  try {
    // Save data to the database
    const document = await prisma.document.create({
      data: {
        name: name,
        description: description,
        file: url,
        ownerId: (session.user as CustomUser).id,
      },
    });

    const link = await prisma.link.create({
      data: {
        documentId: document.id,
        // url: nanoid(),
      },
    });

    res.status(201).json({ document, linkId: link.id });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
}
