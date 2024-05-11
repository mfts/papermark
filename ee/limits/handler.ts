import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { CustomUser } from "@/lib/types";
import { getLimits } from "@/ee/limits/server";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/:teamId/limits
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;

    try {
      const limits = await getLimits({ teamId, userId });

      return res.status(200).json(limits);
    } catch (error) {
      return res.status(500).json((error as Error).message);
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
