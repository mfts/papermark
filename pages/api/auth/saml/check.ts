import { NextApiRequest, NextApiResponse } from "next";

import { z } from "zod";

import initJackson, { getJacksonProduct } from "@/lib/jackson";
import prisma from "@/lib/prisma";

const checkSamlSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const parseDomainFromEmail = (email: string): string => email.split("@")[1] || "";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const emailParam = Array.isArray(req.query.email)
    ? req.query.email[0]
    : req.query.email;

  const result = checkSamlSchema.safeParse({ email: emailParam });
  if (!result.success) {
    return res.status(400).json({ error: "A valid work email is required." });
  }

  const email = result.data.email;
  const domain = parseDomainFromEmail(email);

  if (!domain) {
    return res.status(400).json({ error: "Could not determine email domain." });
  }

  const domainRecord = await prisma.domain.findUnique({
    where: {
      slug: domain,
    },
    select: {
      teamId: true,
    },
  });

  if (!domainRecord) {
    return res
      .status(404)
      .json({ error: "No SSO configuration found for this email domain." });
  }

  const team = await prisma.team.findUnique({
    where: {
      id: domainRecord.teamId,
    },
    select: {
      id: true,
      samlEnabled: true,
      samlProvider: true,
    },
  });

  if (!team?.samlEnabled) {
    return res
      .status(404)
      .json({ error: "No SSO configuration found for this email domain." });
  }

  const product = getJacksonProduct();
  const { connectionController } = await initJackson();
  const connections = await connectionController.getConnections({
    tenant: team.id,
    product,
  });

  if (!connections?.length) {
    return res
      .status(404)
      .json({ error: "No active SSO connection found for this workspace." });
  }

  return res.status(200).json({
    data: {
      teamId: team.id,
      tenant: team.id,
      product,
      provider: team.samlProvider ?? "custom",
    },
  });
}
