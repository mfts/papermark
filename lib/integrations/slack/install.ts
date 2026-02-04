import { nanoid } from "nanoid";

import { redis } from "@/lib/redis";

import { getSlackEnv } from "./env";

// User scopes needed for accessing private channels the user is a member of
// - groups:read: Required to list private channels
// - channels:read: Required to list public channels (backup in user context)
const USER_SCOPES = ["groups:read", "channels:read"];

// Get the installation URL for Slack
export const getSlackInstallationUrl = async (
  teamId: string,
): Promise<string> => {
  const env = getSlackEnv();

  const state = nanoid(16);
  await redis.set(`slack:install:state:${state}`, teamId, {
    ex: 30 * 60,
  });

  const url = new URL(env.SLACK_APP_INSTALL_URL);
  url.searchParams.set(
    "redirect_uri",
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/slack/oauth/callback`,
  );
  url.searchParams.set("state", state);

  // Add user_scope to request user-level permissions for private channel access
  // This allows the app to see private channels the installing user is a member of
  const existingUserScope = url.searchParams.get("user_scope");
  const combinedUserScopes = existingUserScope
    ? [...new Set([...existingUserScope.split(","), ...USER_SCOPES])].join(",")
    : USER_SCOPES.join(",");
  url.searchParams.set("user_scope", combinedUserScopes);

  return url.toString();
};
