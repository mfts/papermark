import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { listUserPasskeys, removeUserPasskey } from "@/lib/api/auth/passkey";
import { errorhandler } from "@/lib/errorHandler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  try {
    if (req.method === "GET") {
      // List passkeys
      const passkeys = await listUserPasskeys({ session });
      res.status(200).json({ passkeys });
      return;
    }

    if (req.method === "DELETE") {
      // Remove passkey
      const { credentialId } = req.body as { credentialId: string };

      if (!credentialId) {
        return res.status(400).json({ error: "Credential ID is required" });
      }

      await removeUserPasskey({ credentialId, session });
      res.status(204).end();
      return;
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    errorhandler(error, res);
  }
}
