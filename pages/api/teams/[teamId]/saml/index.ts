import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { jackson } from "@/lib/jackson";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const userId = (session.user as CustomUser).id;
  const { teamId } = req.query as { teamId: string };

  // Verify user has access to the team and is an admin
  const teamAccess = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    select: { role: true },
  });

  if (!teamAccess) {
    return res.status(401).end("Unauthorized");
  }

  if (teamAccess.role !== "ADMIN") {
    return res.status(403).json({ error: "Only admins can manage SAML SSO" });
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/saml — list SAML connections
    try {
      const { apiController } = await jackson();

      const connections = await apiController.getConnections({
        tenant: teamId,
        product: process.env.JACKSON_PRODUCT!,
      });

      return res.status(200).json(connections);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/saml — create a new SAML connection
    try {
      const { apiController } = await jackson();

      const { rawMetadata, metadataUrl, name, description } = req.body;

      if (!rawMetadata && !metadataUrl) {
        return res.status(400).json({
          error:
            "Either rawMetadata or metadataUrl is required to configure SAML",
        });
      }

      const connection = await apiController.createSAMLConnection({
        defaultRedirectUrl: `${process.env.NEXTAUTH_URL}/auth/saml`,
        redirectUrl: JSON.stringify([
          `${process.env.NEXTAUTH_URL}`,
          `${process.env.NEXTAUTH_URL}/auth/saml`,
        ]),
        tenant: teamId,
        product: process.env.JACKSON_PRODUCT!,
        rawMetadata: rawMetadata || undefined,
        metadataUrl: metadataUrl || undefined,
        name: name || "SAML SSO",
        description: description || "SAML Single Sign-On",
      });

      // Mark team as SAML-enabled in the main DB
      const samlProvider = name?.toLowerCase().includes("okta")
        ? "okta"
        : name?.toLowerCase().includes("google")
          ? "google"
          : name?.toLowerCase().includes("entra") ||
              name?.toLowerCase().includes("azure")
            ? "azure"
            : "custom";

      await prisma.team.update({
        where: { id: teamId },
        data: {
          samlEnabled: true,
          samlProvider,
          samlConnectionId: (connection as any).clientID || null,
        },
      });

      return res.status(201).json(connection);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/saml — remove a SAML connection
    try {
      const { apiController } = await jackson();

      const { clientID, clientSecret } = req.body;

      if (!clientID || !clientSecret) {
        return res
          .status(400)
          .json({ error: "clientID and clientSecret are required" });
      }

      await apiController.deleteConnections({
        clientID,
        clientSecret,
      });

      // Check if there are remaining connections
      const remaining = await apiController.getConnections({
        tenant: teamId,
        product: process.env.JACKSON_PRODUCT!,
      });

      if (!remaining || (Array.isArray(remaining) && remaining.length === 0)) {
        await prisma.team.update({
          where: { id: teamId },
          data: {
            samlEnabled: false,
            samlProvider: null,
            samlConnectionId: null,
          },
        });
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
