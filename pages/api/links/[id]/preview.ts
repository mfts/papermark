import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { createPreviewSession } from "@/lib/auth/preview-auth";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/links/:id/preview
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    const previewSession = await createPreviewSession(
      id,
      (session.user as CustomUser).id,
    );

    return res.status(200).json({ previewToken: previewSession.token });
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
