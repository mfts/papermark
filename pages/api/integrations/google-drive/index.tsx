import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { GoogleDriveClient } from "@/lib/google-drive";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

function sanitizeIntegration(integration: any) {
  if (!integration) return null;

  return {
    id: integration.id,
    email: integration.email,
    name: integration.name,
    picture: integration.picture,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    accessToken: integration.accessToken,
  };
}

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
      const refreshTokenResponse =
        await GoogleDriveClient.getInstance().refreshAccessToken(
          integration!.refreshToken,
        );
      const expiresAt = new Date();
      expiresAt.setSeconds(
        expiresAt.getSeconds() + refreshTokenResponse.expires_in,
      );
      const updatedIntegration = await prisma.googleDriveIntegration.update({
        where: { userId },
        data: {
          expiresAt: expiresAt,
          accessToken: refreshTokenResponse.access_token,
        },
      });
      return res.status(200).json({
        isConnected: !!integration,
        integration: sanitizeIntegration(updatedIntegration),
      });
    }

    return res.status(200).json({
      isConnected: !!integration,
      integration: sanitizeIntegration(integration),
    });
  } catch (error) {
    console.error("Error checking Google Drive connection status:", error);
    return res
      .status(500)
      .json({ error: "Failed to check Google Drive connection status" });
  }
}