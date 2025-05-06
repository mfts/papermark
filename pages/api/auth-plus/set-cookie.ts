import { NextApiRequest, NextApiResponse } from "next";

import { getToken } from "next-auth/jwt";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).end();
  }

  // Set the cookie for the other domain
  res.setHeader(
    "Set-Cookie",
    `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token=${req.cookies[`${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`]}; HttpOnly; Path=/; SameSite=Lax; ${VERCEL_DEPLOYMENT ? "Secure; " : ""}Domain=.papermark.io; Max-Age=${30 * 24 * 60 * 60}`,
  );

  res.status(200).end();
}
