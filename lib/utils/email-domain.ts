export const GENERIC_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "comcast.net",
  "verizon.net",
  "att.net",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "yandex.com",
  "tutanota.com",
  "tuta.com",
  "fastmail.com",
  "hey.com",
];

/**
 * Returns true if the email belongs to a well-known free / consumer email
 * provider (e.g. gmail.com, outlook.com).  Useful for distinguishing
 * organisation-owned domains from personal addresses.
 */
export const isGenericEmail = (email: string): boolean => {
  const domain = email.trim().toLowerCase().split("@").pop();
  return !!domain && GENERIC_EMAIL_DOMAINS.includes(domain);
};

/**
 * Returns true if the bare domain (no "@" prefix) is a well-known free /
 * consumer email provider.
 */
export const isGenericDomain = (domain: string): boolean => {
  return GENERIC_EMAIL_DOMAINS.includes(domain.trim().toLowerCase());
};

export function extractEmailDomain(email: string): string | null {
  if (!email || typeof email !== "string") {
    return null;
  }
  const normalizedEmail = email.trim().toLowerCase();

  const atSymbolCount = (normalizedEmail.match(/@/g) || []).length;
  if (atSymbolCount !== 1) {
    return null;
  }

  const atIndex = normalizedEmail.lastIndexOf("@");
  if (atIndex === -1 || atIndex === normalizedEmail.length - 1) {
    return null;
  }

  const domain = normalizedEmail.substring(atIndex);

  if (domain.length <= 1) {
    return null;
  }

  return domain;
}

export function normalizeListEntry(entry: string): string {
  if (!entry || typeof entry !== "string") {
    return "";
  }
  return entry.trim().toLowerCase();
}

export function isEmailMatched(email: string, entry: string): boolean {
  if (!email || !entry) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedEntry = normalizeListEntry(entry);

  // Direct email match
  if (normalizedEmail === normalizedEntry) {
    return true;
  }

  // Domain match (entry starts with @)
  if (normalizedEntry.startsWith("@")) {
    const emailDomain = extractEmailDomain(normalizedEmail);
    return emailDomain === normalizedEntry;
  }

  return false;
}
