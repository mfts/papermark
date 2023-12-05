import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { errorhandler } from "@/lib/errorHandler";
import { openai } from "@/lib/openai";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/assistants
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { documentId } = req.body as { documentId: string };

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
        },
        select: {
          assistantEnabled: true,
          versions: {
            where: { isPrimary: true },
            take: 1,
            select: {
              id: true,
              fileId: true,
              file: true,
            },
          },
        },
      });

      if (!document) {
        res.status(400).json("No document found");
        return;
      }

      if (document.assistantEnabled) {
        res.status(200).json("Assistant Already Enabled");
        return;
      }

      // Upload the file to OpenAI
      const fileId = (
        await openai.files.create({
          file: await fetch(document.versions[0].file),
          purpose: "assistants",
        })
      ).id;

      // Update the document and documentVersion in the database
      await prisma.documentVersion.update({
        where: {
          id: document.versions[0].id,
        },
        data: {
          fileId: fileId,
          document: {
            update: {
              assistantEnabled: true,
            },
          },
        },
      });

      res.status(200).json("Assistant Enabled");
      return;
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/assistants
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { documentId } = req.body as { documentId: string };

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
        },
        select: {
          assistantEnabled: true,
          versions: {
            where: { isPrimary: true },
            take: 1,
            select: {
              id: true,
              fileId: true,
              file: true,
            },
          },
        },
      });

      if (!document) {
        res.status(400).json("No document found");
        return;
      }

      if (!document.assistantEnabled) {
        res.status(200).json("Assistant is already disabled");
        return;
      }

      // get the open AI file Id from db
      const fileId = document.versions[0].fileId;

      if (fileId) {
        //deleting the file from openai
        await openai.files.del(fileId);
      }

      // Update the document and documentVersion in the database
      await prisma.documentVersion.update({
        where: {
          id: document.versions[0].id,
        },
        data: {
          fileId: null,
          document: {
            update: {
              assistantEnabled: false,
            },
          },
        },
      });

      res.status(200).json("Assistant Disabled");
      return;
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow POST and DELETE requests
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
