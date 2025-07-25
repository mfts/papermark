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
