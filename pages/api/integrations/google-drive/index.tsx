import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { GoogleDriveClient } from "@/lib/google-drive";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // GET api/integrations/google-drive
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (session.user as CustomUser).id;
    let integration;

    try {
      integration = await prisma.googleDriveIntegration.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error("Error finding Google Drive integration:", error);
    }
    if (!integration) {
      return res.status(200).json({ isConnected: false, integration: null });
    }
    const now = new Date();
    const accessTokenExpiresAt = new Date(integration!.expiresAt);
    const refreshTokenExpiresAt = new Date(integration!.refreshTokenExpiresAt);

    const accessTokenExpired = now > accessTokenExpiresAt;
    const refreshTokenExpired = now > refreshTokenExpiresAt;

    if (
      integration?.refreshToken &&
      (accessTokenExpired || refreshTokenExpired)
    ) {
      integration = await GoogleDriveClient.getInstance().refreshAccessToken(
        integration!.refreshToken,
      );
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + integration!.expires_in);
      await prisma.googleDriveIntegration.update({
        where: { userId },
        data: {
          expiresAt: expiresAt,
          accessToken: integration!.access_token,
        },
      });
    }

    return res.status(200).json({ isConnected: !!integration, integration });
  } catch (error) {
    console.error("Error checking Google Drive connection status:", error);
    return res
      .status(500)
      .json({ error: "Failed to check Google Drive connection status" });
  }
}
