
function getTrustedOrigins(): string[] {
  const trusted: string[] = [];

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    try {
      trusted.push(new URL(process.env.NEXT_PUBLIC_BASE_URL).origin);
    } catch {
      // If the env value is not a valid URL, skip it silently.
    }
  }

  if (process.env.NEXT_PUBLIC_MARKETING_URL) {
    try {
      trusted.push(new URL(process.env.NEXT_PUBLIC_MARKETING_URL).origin);
    } catch {
      // If the env value is not a valid URL, skip it silently.
    }
  }

  // Allow localhost explicitly during local development.
  if (process.env.NODE_ENV === "development") {
    trusted.push("http://localhost:3000");
    trusted.push("http://localhost");
  }

  return trusted;
}


//  Returns the origin string if it is in the trusted list, or null if not.
export function getAllowedOrigin(
  requestOrigin: string | undefined,
): string | null {
  if (!requestOrigin) return null;

  try {
    const normalizedOrigin = new URL(requestOrigin).origin;
    const trustedOrigins = getTrustedOrigins();
    return trustedOrigins.includes(normalizedOrigin) ? normalizedOrigin : null;
  } catch {
  
    return null;
  }
}