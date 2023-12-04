import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { FolderDirectory } from "@/lib/types";
import { DataroomFile, DataroomFolder } from "@prisma/client";
import z, { ZodError } from "zod";
import { generateAuthenticationCode } from "@/lib/api/authentication";
import { isUserMemberOfTeam } from "@/lib/team/helper";
import { TeamError } from "@/lib/errorHandler";

const bodySchema = z.object({
  name: z.string(),
  description: z.string().max(150), //Description should be less than 150 characters
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/datarooms/hierarchical
    const { teamId, id } = req.query as { teamId: string; id: string };
    const session = req.query.authentication
      ? JSON.parse(req.query.authentication as string)
      : await getServerSession(req, res, authOptions);
    const userId = (session?.user as CustomUser).id;

    //Prevent unauthorized access from dashboard, however bypass this check if a recipient is trying to access dataroom
    if (teamId) {
      try {
        await isUserMemberOfTeam({ teamId, userId });
      } catch {
        return res.status(401).end("Unauthorized");
      }
    }

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: id,
        },
      });

      if (!dataroom) {
        return res.status(404).end("Dataroom not found");
      }

      //We want to minimize database calls as processing data on server is more efficient
      const folders = await prisma.dataroomFolder.findMany({
        where: {
          dataroomId: id,
        },
      });

      const files = await prisma.dataroomFile.findMany({
        where: {
          dataroomId: id,
        },
      });

      //Create FolderDirectory data structure
      const homeFolder = folders.find(
        (folder: DataroomFolder) => !folder.parentFolderId,
      ) as DataroomFolder;
      let folderDirectory: FolderDirectory = {};
      let folderQueue: string[] = [];
      folderQueue.push(homeFolder.id);
      while (folderQueue.length !== 0) {
        const folderId = folderQueue.pop() as string;
        const currFolder = folders.find(
          (folder: DataroomFolder) => folder.id === folderId,
        ) as DataroomFolder;
        folderDirectory[folderId] = {
          name: currFolder.name,
          subfolders: folders
            .filter(
              (folder: DataroomFolder) =>
                folder.parentFolderId === currFolder.id,
            )
            .map((folder: DataroomFolder) => folder.id),
          files: files.filter(
            (file: DataroomFile) => file.parentFolderId === currFolder.id,
          ),
          href: currFolder.parentFolderId
            ? folderDirectory[currFolder.parentFolderId].href +
              `/${currFolder.id}`
            : `/${currFolder.id}`,
        };
        folderQueue = [...folderQueue, ...folderDirectory[folderId].subfolders];
      }

      return res.status(200).json({ dataroom, folderDirectory });
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "POST") {
    // POST /api/datarooms/hierarchical
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    //Input validation
    let name: string;
    let description: string;
    const subBody = { name: req.body.name, description: req.body.name };
    const { password, emailProtected, teamId } = req.body;
    const userId = (session?.user as CustomUser).id;

    try {
      //Input Validation
      ({ name, description } = bodySchema.parse(subBody));
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      const dataroomName = await prisma.dataroom.findFirst({
        where: {
          name: name,
        },
      });

      if (dataroomName) {
        return res.status(409).json({
          message: `A dataroom with name "${name}" already exists. Please try another name`,
        });
      }

      // Save data to the database
      const dataroom = await prisma.dataroom.create({
        data: {
          name: name,
          description: description,
          password,
          emailProtected,
          type: "HIERARCHICAL",
          ownerId: (session.user as CustomUser).id,
          teamId,
        },
      });

      // Create a home folder
      const homeFolder = await prisma.dataroomFolder.create({
        data: {
          name: "Home",
          dataroomId: dataroom.id,
        },
      });

      //Create a authentication code (To be used for verification if not emailProtected and not password protected)
      let authenticationCode: string = "";
      if (!emailProtected && !password) {
        authenticationCode = await generateAuthenticationCode(
          12,
          session.user?.email as string,
          dataroom.id,
          "DATAROOM",
          "PERMANENT",
        );
      }

      await identifyUser((session.user as CustomUser).id);
      await trackAnalytics({
        event: "Dataroom Created",
        dataroomId: dataroom.id,
        name: dataroom.name,
      });

      res.status(201).json({ dataroom, homeFolder, authenticationCode });
    } catch (error) {
      if (error instanceof TeamError) {
        return res.status(401).json({ message: "Unauthorized access" });
      } else if (error instanceof ZodError) {
        return res.status(403).json({
          message: "Invalid Inputs",
          error: (error as Error).message,
        });
      }
      log(`Failed to create dataroom. Error: \n\n ${error}`);
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "PUT") {
    // PUT /api/datarooms/hierarchical
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    //Input validation
    let name: string;
    let description: string;
    const subBody = { name: req.body.name, description: req.body.name };
    const { teamId, id } = req.body;
    const userId = (session?.user as CustomUser).id;

    try {
      //Input validation
      ({ name, description } = bodySchema.parse(subBody));
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      //Check if dataroom exists
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: id,
        },
        select: {
          ownerId: true,
        },
      });

      await prisma.dataroom.update({
        where: {
          id: id,
        },
        data: {
          name,
          description,
        },
      });

      res.status(200).json({ message: "Dataroom name/description updated!" });
    } catch (error) {
      if (error instanceof TeamError) {
        return res.status(401).json({ message: "Unauthorized access" });
      } else if (error instanceof ZodError) {
        return res.status(403).json({
          message: "Invalid Inputs",
          error: (error as Error).message,
        });
      }
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow POST, GET, and PUT requests
    res.setHeader("Allow", ["POST", "GET", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
