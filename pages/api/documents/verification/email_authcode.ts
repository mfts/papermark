import { NextApiRequest, NextApiResponse } from "next";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";
import prisma from "@/lib/prisma";
import z from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  linkId: z.string()
})

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/documents/verification/email_authcode 
    // Verify authcode
    const { authenticationCode } = req.query;
    const code = authenticationCode as string;

    //Check verification code in database and delete it
    try {
      const response = await prisma.emailAuthenticationCode.delete({
        where: {
          code
        }
      })
      res.status(200).json({ message: "Verification successful" });
    } catch {
      res.status(401).json({ message: "Unauthorized access" });
    }

  } else if (req.method === "POST") {
    // POST /api/documents/verification/email_authcode

    // Input validation
    let email: string;
    let linkId: string;
    try {
      const parsedBody = bodySchema.parse(req.body);
      email = parsedBody.email;
      linkId = parsedBody.linkId;
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
        linkId
      }
    })
    const URL = `${process.env.NEXTAUTH_URL}/view/${linkId}?authenticationCode=${authenticationCode}`;

    await sendVerificationEmail(email, URL);
    console.log(URL);
    res.status(200).json({ authenticationCode });

  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function generateUniqueString(length: number) {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; // You can customize this as needed.
  let uniqueString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    uniqueString += charset.charAt(randomIndex);
  }

  return uniqueString;
}