import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import z from "zod";
import { isUserMemberOfTeam } from "@/lib/team/helper";
import { TeamError } from "@/lib/errorHandler";
import { ZodError } from "zod";

const bodySchema = z.object({
  name: z.string(),
  description: z.string().max(150), //Description should be less than 150 words
  titles: z.array(z.string().max(100)).max(20), //Titles with max length 100 and max no of titles = 20
  links: z.array(z.string()), //Links which are string,
  password: z.string().max(30),
  emailProtected: z.boolean(),
  teamId: z.string()
})

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/datarooms/paged
    const { id } = req.query as { id: string };
    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id
        }, 
        include: {
          files: true
        }
      });
      if (!dataroom) {
        return res.status(404).end("Dataroom not found");
      }
      return res.status(200).json(dataroom);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "POST") {
    // POST /api/datarooms/paged
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    //Input validation 
    let name: string;
    let description: string;
    let titles: string[];
    let links: string[];
    let password: string;
    let emailProtected: boolean;
    let teamId: string;
    const userId = (session?.user as CustomUser).id;

    try {
      //Input Validation
      ({ name, description, titles, links, password, emailProtected, teamId } = bodySchema.parse(req.body));
      //Check if user if member of team
      await isUserMemberOfTeam({ teamId, userId });
      const dataroomName = await prisma.dataroom.findFirst({
        where: {
          name: name
        }
      })

      if (dataroomName) {
        return res.status(409).json({
          message: `A dataroom with name "${name}" already exists. Please try another name`,
        });
      }

      // Create dataroom
      const dataroom = await prisma.dataroom.create({
        data: {
          name: name,
          description: description,
          type: "PAGED",
          emailProtected: emailProtected,
          password: password,
          ownerId: (session.user as CustomUser).id,
          teamId
        },
      });

      //Save files to dataroom
      for (let i = 0; i < links.length; i++) {
        await prisma.dataroomFile.create({
          data: {
            name: titles[i],
            url: links[i],
            dataroomId: dataroom.id
          }
        })
      }

      await identifyUser((session.user as CustomUser).id);
      await trackAnalytics({
        event: "Dataroom Created",
        dataroomId: dataroom.id,
        name: dataroom.name,
      });

      res.status(201).json(dataroom);
    } catch (error) {
      if (error instanceof TeamError) {
        return res.status(401).json({ message: "Unauthorized access" });
      } else if (error instanceof ZodError) {
        return res.status(403).json({
          message: "Invalid Inputs",
          error: (error as Error).message,
        });
      }
      log(`Failed to create dataroom. Error: \n\n ${error}`)
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