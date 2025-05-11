import { get } from "@vercel/edge-config";

export const getCustomEmail = async (teamId?: string) => {
  if (!process.env.EDGE_CONFIG || !teamId) {
    return null;
  }

  let customEmails: Record<string, string | null> = {};
  try {
    const result = await get("customEmail");
    // Make sure we get a valid object
    customEmails =
      typeof result === "object" && result !== null
        ? (result as Record<string, string | null>)
        : {};
  } catch (e) {
    // Error getting custom emails, return null
    return null;
  }

  // Return the custom email for the team if it exists
  return customEmails[teamId] || null;
};
