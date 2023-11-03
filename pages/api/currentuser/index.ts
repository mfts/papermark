import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser } from "@/lib/session";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method === "GET") {
    const response = await getCurrentUser(req, res);
    const currentUser = await response;  
    return res.json(currentUser)
  }
}
