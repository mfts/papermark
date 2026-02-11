import prisma from "@/lib/prisma";

/**
 * Checks if SAML SSO is enforced for a given email address's domain.
 * When enforced, users with this email domain MUST use SSO to log in —
 * email magic links, Google OAuth, etc. are blocked.
 */
export async function isSamlEnforcedForEmailDomain(
  email: string,
): Promise<boolean> {
  const emailDomain = email.split("@")[1]?.toLowerCase();

  if (!emailDomain) {
    return false;
  }

  // Skip generic email providers — SSO enforcement doesn't apply
  const genericDomains = [
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "aol.com",
    "icloud.com",
    "me.com",
    "mail.com",
    "protonmail.com",
    "proton.me",
    "fastmail.com",
    "zoho.com",
  ];

  if (genericDomains.includes(emailDomain)) {
    return false;
  }

  const team = await prisma.team.findUnique({
    where: {
      ssoEmailDomain: emailDomain,
    },
    select: {
      ssoEnforcedAt: true,
    },
  });

  return !!team?.ssoEnforcedAt;
}
