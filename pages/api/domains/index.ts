import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { addDomainToVercel, validDomainRegex } from "@/lib/domains";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { Prisma } from "@prisma/client";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/domains
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const domains = await prisma.domain.findMany({
      where: {
        userId: (session.user as CustomUser).id,
      },
      select: {
        slug: true,
        verified: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // console.log("Domains from GET", domains)
    return res.status(200).json(domains);

  } else if (req.method === "POST") {
    // POST /api/domains
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    // Assuming data is an object with `domain` properties
    const { domain } = req.body;

    // You could perform some validation here

    try {
      // TODO: Add check for if the domain already exists on another user
      const validDomain = validDomainRegex.test(domain);
      if (validDomain !== true) {
        return res.status(422).json({ message: "Invalid domain" });
      }

      // Don't allow papermark.io domains
      if (domain.includes("papermark.io")) {
        return res
          .status(422)
          .json({ message: "Papermark domains cannot be custom domains" });
      }

      // console.log("Valid domain", domain);

      const response = await prisma.domain.create({
        data: {
          slug: domain,
          userId: (session.user as CustomUser).id,
        },
      });
      await addDomainToVercel(domain);

      await identifyUser((session.user as CustomUser).id);
      await trackAnalytics({
        event: "Domain Added",
        slug: domain,
      });

      res.status(201).json(response);
    } catch (error) {
      log(`Failed to add domain: ${domain}. Error: \n\n ${error}`);
      // Handle unique constraint error
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(422).json({
          message:
            "This domain already exists. Please choose a different domain.",
        });
      }
      // Handle other errors
      res
        .status(500)
        .json({
          message: "An unexpected error occurred. Please try again later.",
        });
    }  
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
