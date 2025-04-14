import { get } from "@vercel/edge-config";

export const isBlacklistedEmail = async (email: string) => {
  if (!process.env.EDGE_CONFIG) {
    return false;
  }

  let blacklistedEmails: string[] = [];
  try {
    const result = await get("emails");
    // Make sure we only use string arrays
    blacklistedEmails = Array.isArray(result)
      ? result.filter((item): item is string => typeof item === "string")
      : [];
  } catch (e) {
    // Already initialized as empty array
  }

  if (blacklistedEmails.length === 0) return false;
  return new RegExp(blacklistedEmails.join("|"), "i").test(email);
};
