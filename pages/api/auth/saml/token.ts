import { NextApiRequest, NextApiResponse } from "next";

import * as jose from "jose";
import * as openidClient from "openid-client";

import initJackson from "@/lib/jackson";

const normalizeTokenBody = (body: unknown): Record<string, unknown> => {
  if (!body) return {};

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  if (typeof body === "object") {
    return body as Record<string, unknown>;
  }

  return {};
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Import hack for jackson/oauth dependencies in bundled environments.
  void openidClient;
  void jose;

  const { oauthController } = await initJackson();
  const payload = normalizeTokenBody(req.body);

  try {
    const token = await oauthController.token(payload as any);
    return res.status(200).json(token);
  } catch (error) {
    return res.status(400).json({
      error: (error as Error).message || "Failed to exchange token.",
    });
  }
}
