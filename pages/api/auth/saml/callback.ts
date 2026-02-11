import { NextApiRequest, NextApiResponse } from "next";

import { jackson } from "@/lib/jackson";

// Disable body parsing — we need the raw form data
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { oauthController } = await jackson();

    const { RelayState, SAMLResponse } = req.body;

    const { redirect_url } = await oauthController.samlResponse({
      RelayState,
      SAMLResponse,
    });

    if (!redirect_url) {
      return res.status(400).json({ error: "No redirect URL returned" });
    }

    return res.redirect(302, redirect_url);
  } catch (error: any) {
    console.error("[SAML] Callback error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
