const vercelUrlWithProtocol = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

export const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  vercelUrlWithProtocol ||
  "http://localhost:3000";
