import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // POST /api/billing/manage – manage a user's subscription
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as CustomUser).id },
      select: {
        id: true,
        subscriptionId: true,
        startsAt: true,
        endsAt: true,
        plan: true,
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "User does not exists" });
    }

    // console.log("user", user);

    return res.status(200).json(user);
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
