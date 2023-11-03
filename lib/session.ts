import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
export async function getCurrentUser(req: NextApiRequest ,res: NextApiResponse) {
    const session = await getServerSession(req, res , authOptions)
    return session?.user
}

