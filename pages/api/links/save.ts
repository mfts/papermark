import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // POST /api/links/save
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    // Extract link information from the request body
    const { linkId } = req.body;

    // Check linkId validity (You can add more validations if needed)
    if (!linkId) {
      return res.status(400).json({ error: "linkId is required" });
    }

    const userIdFromSession = (session.user as CustomUser).id;

    try {
      // Check if the link is already saved by the user
      const existingSavedLink = await prisma.savedLink.findFirst({
        where: {
          userId: userIdFromSession,
          linkId: linkId
        }
      });

      if (existingSavedLink) {
        return res.status(200).json({ success: true, existingSavedLink });
      }

      const savedLink = await prisma.savedLink.create({
        data: {
          userId: (session.user as CustomUser).id,
          linkId: linkId,
        },
      });


      // Return the saved link information (or just a success message)
      return res.status(200).json({ success: true, savedLink });
    } catch (error) {
      // Handle potential errors, like if the link already exists for the user

      return res
        .status(500)
        .json({ error: "An error occurred while saving the link" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
