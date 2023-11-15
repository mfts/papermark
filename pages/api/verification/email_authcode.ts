import { NextApiRequest, NextApiResponse } from "next";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";
import prisma from "@/lib/prisma";
import z from "zod";
import { generateUniqueString } from "@/lib/api/authentication";

const bodySchema = z.object({
  email: z.string().email(),
  identifier: z.string(),    //linkId if link, dataroomId if dataroom
  type: z.enum(["DOCUMENT", "DATAROOM"])
})

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/verification/email_authcode 
    // Verify authcode
    const { authenticationCode } = req.query;
    const code = authenticationCode as string;

    //Check verification code in database and delete it
    try {
      await prisma.emailAuthenticationCode.delete({
        where: {
          code
        }
      })
      res.status(200).json({ message: "Verification successful" });
    } catch {
      res.status(401).json({ message: "Unauthorized access" });
    }

  } else if (req.method === "POST") {
    // POST /api/verification/email_authcode

    // Input validation
    let email: string;
    let identifier: string;
    let type: "DOCUMENT" | "DATAROOM";
    try {
      const parsedBody = bodySchema.parse(req.body);
      email = parsedBody.email;
      identifier = parsedBody.identifier;
      type = parsedBody.type;
    } catch (error) {
      res.status(409).json({ message: `Invalid inputs` })
      return;
    }

    // Generate authcode
    const authenticationCode = generateUniqueString(12);
    await prisma.emailAuthenticationCode.create({
      data: {
        email,
        code: authenticationCode,
        identifier,
        type
      }
    })
    const URL = type === "DOCUMENT" 
    ? `${process.env.NEXTAUTH_URL}/view/${identifier}?authenticationCode=${authenticationCode}`
    : `${process.env.NEXTAUTH_URL}/view/dataroom/page/${identifier}?authenticationCode=${authenticationCode}`;

    await sendVerificationEmail(email, URL);
    res.status(200).json({ authenticationCode });

  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}