import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { log } from "@/lib/utils";
import z from "zod";
import { isUserMemberOfTeam } from "@/lib/team/helper";
import { CustomUser } from "@/lib/types";
import { errorHandler } from "@/lib/errorHandler";

const bodySchema = z.object({
  fileName: z.string().max(30), //File name should be less than 30 words
  dataroomId: z.string(),
  parentFolderId: z.string(),
  url: z.string(),
  teamId: z.string(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    // GET /api/datarooms/hierarchical/files
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, fileId } = req.body;
    const userId = (session?.user as CustomUser).id;
    try {
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      const file = await prisma.dataroomFile.delete({
        where: {
          id: fileId,
        },
      });

      res.status(200).json({ file });
    } catch (error) {
      errorHandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/datarooms/hierarchical/files
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    //Input validation
    let fileName: string;
    let dataroomId: string;
    let parentFolderId: string;
    let url: string;
    let teamId: string;

    const userId = (session?.user as CustomUser).id;
    try {
      //Input validation
      ({ fileName, dataroomId, parentFolderId, url, teamId } = bodySchema.parse(
        req.body,
      ));
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      const file = await prisma.dataroomFile.create({
        data: {
          name: fileName,
          parentFolderId,
          dataroomId,
          url,
        },
      });

      res.status(201).json({ file });
    } catch (error) {
      errorHandler(error, res);
      log(`Failed to add file. Error: \n\n ${error}`);
    }
  } else if (req.method === "PUT") {
    // PUT /api/datarooms/hierarchical/files
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }
    const { updatedFileName, fileId, teamId } = req.body;

    //Update file name
    const userId = (session?.user as CustomUser).id;
    try {
      //Input validation (Max no of words = 150)
      z.string().max(150).parse(updatedFileName);
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      const file = await prisma.dataroomFile.update({
        where: {
          id: fileId,
        },
        data: {
          name: updatedFileName,
        },
      });

      res.status(201).json({ file, message: "File renamed successfully" });
    } catch (error) {
      errorHandler(error, res);
      log(`Failed to create file. Error: \n\n ${error}`);
    }
  } else {
    // We only allow POST, DELETE AND PUT requests
    res.setHeader("Allow", ["DELETE", "POST", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
