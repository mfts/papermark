import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getExtension, log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    try {
      const documents = await prisma.document.findMany({
        where: {
          ownerId: (session.user as CustomUser).id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: { links: true, views: true },
          },
          links: {
            take: 1,
            select: { id: true },
          },
        },
      });

      res.status(200).json(documents);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "POST") {
    // POST /api/documents
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    // Assuming data is an object with `name` and `description` properties
    const { name, url, numPages } = req.body;

    // Get the file extension and save it as the type
    const type = getExtension(name);

    // You could perform some validation here

    try {
      // Save data to the database
      const document = await prisma.document.create({
        data: {
          name: name,
          numPages: numPages,
          file: url,
          type: type,
          ownerId: (session.user as CustomUser).id,
          links : {
            create: {}
          }
        },
        include: {
          links: true,
        },
      });

      res.status(201).json(document);
    } catch (error) {
      log(`Failed to create document. Error: \n\n ${error}`)
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
