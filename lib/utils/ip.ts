export function getIpAddress(headers: {
  [key: string]: string | string[] | undefined;
}): string {
  // Check x-forwarded-for header (most common for proxied requests)
  const forwardedFor = headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) return ip;
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    const ip = forwardedFor[0].split(",")[0]?.trim();
    if (ip) return ip;
  }

  // Check x-real-ip header (nginx proxy)
  const realIp = headers["x-real-ip"];
  if (typeof realIp === "string") {
    const ip = realIp.trim();
    if (ip) return ip;
  }
  if (Array.isArray(realIp) && realIp.length > 0) {
    const ip = realIp[0].trim();
    if (ip) return ip;
  }

  // Fallback to localhost
  return "127.0.0.1";
}
