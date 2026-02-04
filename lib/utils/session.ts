import { userAgent } from "next/server";

/**
 * Anonymizes an IP address for GDPR compliance
 * IPv4: 192.168.1.100 -> 192.168.1.xxx
 * IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 -> 2001:0db8:85a3:xxxx:xxxx:xxxx:xxxx:xxxx
 */
export function anonymizeIp(ip: string | null | undefined): string | null {
  if (!ip) return null;

  // Check if IPv4
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }

  // Check if IPv6
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 4) {
      // Keep first 3 segments, anonymize rest
      return `${parts.slice(0, 3).join(":")}:xxxx:xxxx:xxxx:xxxx:xxxx`;
    }
  }

  return null;
}

/**
 * Parses user agent string to extract browser, OS, and device info
 */
export function parseUserAgent(ua: string | null): {
  browser: string;
  os: string;
  device: string;
} {
  if (!ua) {
    return { browser: "Unknown", os: "Unknown", device: "Unknown" };
  }

  // Parse using next/server userAgent utility
  const parsed = userAgent({ headers: new Headers({ "user-agent": ua }) });

  return {
    browser: parsed.browser?.name || "Unknown",
    os: parsed.os?.name || "Unknown",
    device: parsed.device?.type || "desktop",
  };
}

/**
 * Generates a unique session token for tracking
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Format relative time for session display
 */
export function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
