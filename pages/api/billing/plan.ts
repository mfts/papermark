import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/billing/plan
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: (session.user as CustomUser).id,
      },
      select: {
        plan: true,
      },
    });

    // console.log("Domains from GET", domains)
    return res.status(200).json(user);
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
