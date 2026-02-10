import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";
import { z } from "zod";

import initJackson, { getJacksonProduct, getSamlAudience } from "@/lib/jackson";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

const createSamlConnectionSchema = z
  .object({
    provider: z.enum(["azure", "okta", "google", "custom"]).optional(),
    metadataUrl: z.string().url().optional(),
    rawMetadata: z.string().min(1).optional(),
    encodedRawMetadata: z.string().min(1).optional(),
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(200).optional(),
  })
  .refine(
    ({ metadataUrl, rawMetadata, encodedRawMetadata }) =>
      !!metadataUrl || !!rawMetadata || !!encodedRawMetadata,
    {
      message:
        "Provide metadataUrl, rawMetadata, or encodedRawMetadata to configure SAML.",
    },
  );

const deleteSamlConnectionSchema = z
  .object({
    clientID: z.string().min(1),
    clientSecret: z.string().min(1),
  })
  .partial();

const inferProvider = (providerName?: string | null): string => {
  const value = (providerName ?? "").toLowerCase();

  if (
    value.includes("microsoft") ||
    value.includes("azure") ||
    value.includes("entra")
  ) {
    return "azure";
  }
  if (value.includes("okta")) return "okta";
  if (value.includes("google")) return "google";
  return "custom";
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unexpected error";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };
  const userId = (session.user as CustomUser).id;

  const teamAccess = await prisma.userTeam.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!teamAccess) {
    return res.status(401).end("Unauthorized");
  }

  if (teamAccess.role !== "ADMIN") {
    return res.status(403).json({ error: "Only team admins can manage SSO." });
  }

  const product = getJacksonProduct();
  const { connectionController } = await initJackson();
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.JACKSON_EXTERNAL_URL ??
    "http://localhost:3000";

  if (req.method === "GET") {
    try {
      const connections = await connectionController.getConnections({
        tenant: teamId,
        product,
      });

      const sanitizedConnections = connections.map((connection) => {
        if ("clientSecret" in connection) {
          const { clientSecret: _clientSecret, ...safeConnection } = connection;
          return safeConnection;
        }
        return connection;
      });

      return res.status(200).json({
        connections: sanitizedConnections,
        issuer: getSamlAudience(),
        acs: `${baseUrl}/api/auth/saml/callback`,
      });
    } catch (error) {
      return res.status(400).json({ error: toErrorMessage(error) });
    }
  }

  if (req.method === "POST") {
    const parsedBody = createSamlConnectionSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.message });
    }

    const {
      provider,
      metadataUrl,
      rawMetadata,
      encodedRawMetadata,
      name,
      description,
    } = parsedBody.data;

    const connectionPayload = {
      defaultRedirectUrl: `${baseUrl}/auth/saml`,
      redirectUrl: [`${baseUrl}/auth/saml`, baseUrl],
      tenant: teamId,
      product,
      ...(metadataUrl ? { metadataUrl } : {}),
      ...(encodedRawMetadata
        ? { encodedRawMetadata }
        : rawMetadata
          ? { rawMetadata }
          : {}),
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
    } as Parameters<typeof connectionController.createSAMLConnection>[0];

    try {
      const connection =
        await connectionController.createSAMLConnection(connectionPayload);

      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          samlEnabled: true,
          samlProvider: provider ?? inferProvider(connection.idpMetadata?.provider),
          samlConnectionId: connection.clientID,
        },
      });

      return res.status(201).json(connection);
    } catch (error) {
      return res.status(400).json({ error: toErrorMessage(error) });
    }
  }

  if (req.method === "DELETE") {
    const parsedBody = deleteSamlConnectionSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.message });
    }

    const { clientID, clientSecret } = parsedBody.data;

    try {
      if (clientID && clientSecret) {
        await connectionController.deleteConnections({
          clientID,
          clientSecret,
        });
      } else {
        await connectionController.deleteConnections({
          tenant: teamId,
          product,
        });
      }

      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          samlEnabled: false,
          samlProvider: null,
          samlConnectionId: null,
        },
      });

      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(400).json({ error: toErrorMessage(error) });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
