import { InstalledIntegration } from "@prisma/client";

import { getSlackEnv } from "./env";
import { SlackCredential } from "./types";
import { decryptSlackToken } from "./utils";

export const uninstallSlackIntegration = async ({
  installation,
}: {
  installation: InstalledIntegration;
}) => {
  const env = getSlackEnv();
  const credentials = installation.credentials as SlackCredential;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const response = await fetch("https://slack.com/api/apps.uninstall", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: decryptSlackToken(credentials.accessToken),
      client_id: env.SLACK_CLIENT_ID,
      client_secret: env.SLACK_CLIENT_SECRET,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  const data = await response.json();

  if (!response.ok || !data.ok) {
    console.error("[Slack App]", data);
    throw new Error("Failed to remove the app from the Slack workspace.");
  }
};
