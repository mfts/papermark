import dns from "dns";
import type { NextApiRequest, NextApiResponse } from "next";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

// Patterns that indicate Outlook/Microsoft or secureserver.net MX records
const OUTLOOK_MX_PATTERNS = [
  "outlook.com",
  "microsoft.com",
  "office365.us",
  "protection.outlook.com",
  "mail.protection.outlook.com",
  "eo.outlook.com",
  "olc.protection.outlook.com",
];

const SECURESERVER_MX_PATTERNS = ["secureserver.net", "mailstore1.secureserver.net"];

type EmailProvider = "outlook" | "secureserver" | null;

interface CheckEmailMxResponse {
  provider: EmailProvider;
  hasQuarantineRisk: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckEmailMxResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const domain = email.split("@")[1]?.toLowerCase();

  if (!domain) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const mxRecords = await resolveMx(domain);

    if (!mxRecords || mxRecords.length === 0) {
      return res.json({ provider: null, hasQuarantineRisk: false });
    }

    // Check if any MX record matches Outlook/Microsoft patterns
    const isOutlook = mxRecords.some((record) =>
      OUTLOOK_MX_PATTERNS.some((pattern) =>
        record.exchange.toLowerCase().includes(pattern),
      ),
    );

    if (isOutlook) {
      return res.json({ provider: "outlook", hasQuarantineRisk: true });
    }

    // Check if any MX record matches secureserver.net patterns
    const isSecureServer = mxRecords.some((record) =>
      SECURESERVER_MX_PATTERNS.some((pattern) =>
        record.exchange.toLowerCase().includes(pattern),
      ),
    );

    if (isSecureServer) {
      return res.json({ provider: "secureserver", hasQuarantineRisk: true });
    }

    return res.json({ provider: null, hasQuarantineRisk: false });
  } catch (error) {
    // If DNS lookup fails (e.g., domain doesn't exist), return no risk
    console.error("MX lookup error:", error);
    return res.json({ provider: null, hasQuarantineRisk: false });
  }
}
