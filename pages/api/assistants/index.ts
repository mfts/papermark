import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import { getFile } from "@/lib/files/get-file";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";
import { openai } from "@/lib/openai";
import prisma from "@/lib/prisma";

export default createAuthenticatedHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
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
              storageType: true,
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
          file: await fetch(
            await getFile({
              type: document.versions[0].storageType,
              data: document.versions[0].file,
            }),
          ),
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
  },
  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
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
  },
});
