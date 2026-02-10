import { NextApiRequest, NextApiResponse } from "next";

import initJackson from "@/lib/jackson";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { oauthController } = await initJackson();

  const RelayState =
    typeof req.body?.RelayState === "string" ? req.body.RelayState : "";
  const SAMLResponse =
    typeof req.body?.SAMLResponse === "string" ? req.body.SAMLResponse : "";

  const { redirect_url, app_select_form, response_form, error } =
    await oauthController.samlResponse({
      RelayState,
      SAMLResponse,
    });

  if (error) {
    return res.status(400).json({ error });
  }

  if (redirect_url) {
    return res.redirect(302, redirect_url);
  }

  const formMarkup = app_select_form ?? response_form;

  if (formMarkup) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(formMarkup);
  }

  return res.status(400).json({ error: "No redirect URL found." });
}
