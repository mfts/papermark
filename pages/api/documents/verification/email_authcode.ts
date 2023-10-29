import { NextApiRequest, NextApiResponse } from "next";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";

var verificationCodes: string[] = [];

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/documents/verification/email_authcode 
    // Verify authcode
    const verificationCode: string | undefined = req.query.authenticationCode as string;
    
    if (verificationCode && verificationCodes.includes(verificationCode)) {
      res.status(200).json({message : "Verification successful"});
    } else {
      res.status(401).json({message : "Unauthorized access"});
    }

  } else if (req.method === "POST") {
    // POST /api/documents/verification/email_authcode
    // Generate authcode
    const authenticationCode: string = Math.floor(100000 + Math.random() * 900000).toString();
    const { email, linkId } = req.body;
    const URL = process.env.NEXTAUTH_URL + '/view/' + linkId + '?authenticationCode=' + authenticationCode;

    verificationCodes.push(authenticationCode);
    const writeData = await JSON.stringify(verificationCodes);

    await sendVerificationEmail(email, URL);
    res.status(200).json({ authenticationCode });

  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
