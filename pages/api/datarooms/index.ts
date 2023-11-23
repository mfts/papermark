import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import z from "zod";

const bodySchema = z.object({
  name: z.string(),
  description: z.string().max(150), //Description should be less than 150 words
  titles: z.array(z.string().max(100)).max(20), //Titles with max length 100 and max no of titles = 20
  ids: z.array(z.string().max(100)).max(20), //Ids with max length 100 and max no of titles = 20
  links: z.array(z.string()) //Links which are string
})

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/datarooms
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    try {
      const pagedDatarooms = await prisma.dataroom.findMany({
        where: {
          ownerId: (session.user as CustomUser).id,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          documentsIds: true
        }
      })

      const hierarchicalDatarooms = await prisma.hierarchicalDataroom.findMany({
        where: {
          ownerId: (session.user as CustomUser).id
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select:{
              files: true
            }
          }
        }
        
      })

      const homePages = await prisma.dataroomFolder.findMany({
        where: {
          parentFolderId: null
        }
      })

      res.status(200).json({ pagedDatarooms, hierarchicalDatarooms, homePages });
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "POST") {
    // POST /api/datarooms
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    //Input validation 
    let name: string;
    let description: string;
    let titles: string[];
    let ids: string[];
    let links: string[];
    try {
      ({ name, description, titles, ids, links } = bodySchema.parse(req.body));
    } catch (error) {
      res.status(400).json({
        message: "Invalid Inputs",
        error: (error as Error).message,
      });
      return;
    }

    try {
      const dataroomName = await prisma.dataroom.findFirst({
        where: {
          name: name
        }
      })

      if (dataroomName) {
        res.status(409).json({
          message: `A dataroom with name "${name}" already exists. Please try another name`,
        });
        return;
      }

      // Save data to the database
      const dataroom = await prisma.dataroom.create({
        data: {
          name: name,
          description: description,
          documentsTitles: titles,
          documentsIds: ids,
          documentsLinks: links,
          ownerId: (session.user as CustomUser).id,
        },
      });

      await identifyUser((session.user as CustomUser).id);
      await trackAnalytics({
        event: "Dataroom Created",
        dataroomId: dataroom.id,
        name: dataroom.name,
      });

      res.status(201).json(dataroom);
    } catch (error) {
      log(`Failed to create dataroom. Error: \n\n ${error}`)
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET, POST and DELETE requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}