import { NextApiRequest, NextApiResponse } from "next";

import { type OAuthReq } from "@boxyhq/saml-jackson";

import initJackson from "@/lib/jackson";

const normalizeValues = (
  data: Record<string, string | string[] | undefined>,
): Record<string, string> => {
  const entries = Object.entries(data).map(([key, value]) => [
    key,
    Array.isArray(value) ? value[0] : value,
  ]);

  return Object.fromEntries(
    entries.filter(([, value]) => typeof value === "string" && value.length > 0),
  ) as Record<string, string>;
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { oauthController } = await initJackson();

  const requestParams =
    req.method === "GET"
      ? normalizeValues(req.query)
      : normalizeValues(req.body ?? {});

  const { redirect_url, authorize_form, error } =
    await oauthController.authorize(requestParams as unknown as OAuthReq);

  if (error) {
    return res.status(400).json({ error });
  }

  if (redirect_url) {
    return res.redirect(302, redirect_url);
  }

  if (authorize_form) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(authorize_form);
  }

  return res.status(400).json({ error: "No redirect URL found." });
}
