import { get } from "@vercel/edge-config";

import { isTrustedTeam } from "@/lib/edge-config/trusted-teams";
import { log } from "@/lib/utils";
import { validateUrlSecurity } from "@/lib/zod/url-validation";

type ValidationResult =
  | { valid: true; url: string }
  | { valid: false; message: string };

export async function validateRedirectUrl(
  redirectUrl: string,
  teamId: string,
): Promise<ValidationResult> {
  const trimmed = redirectUrl.trim();

  if (!trimmed) {
    return { valid: true, url: "" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, message: "Invalid redirect URL" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, message: "Redirect URL must use HTTP or HTTPS" };
  }

  if (!validateUrlSecurity(trimmed)) {
    return {
      valid: false,
      message: "Redirect URL targets a disallowed resource",
    };
  }

  const trusted = await isTrustedTeam(teamId);
  if (!trusted) {
    try {
      const keywords = await get("keywords");
      if (Array.isArray(keywords) && keywords.length > 0) {
        const matchedKeyword = keywords.find(
          (keyword) => typeof keyword === "string" && trimmed.includes(keyword),
        );

        if (matchedKeyword) {
          log({
            message: `Redirect URL blocked: ${matchedKeyword} \n\n \`Metadata: {teamId: ${teamId}, url: ${trimmed}}\``,
            type: "error",
            mention: true,
          });
          return { valid: false, message: "This URL is not allowed" };
        }
      }
    } catch {
      // Edge config unavailable; allow the URL through
    }
  }

  // Return the sanitized URL (trimmed, with resolved origin)
  return { valid: true, url: parsed.toString() };
}
