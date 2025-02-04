import { auth } from "@trigger.dev/sdk/v3";

export async function generateTriggerPublicAccessToken(tag: string) {
  return auth.createPublicToken({
    scopes: {
      read: {
        tags: [tag],
      },
    },
    expirationTime: "15m",
  });
}
