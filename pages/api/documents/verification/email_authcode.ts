import { NextApiRequest, NextApiResponse } from "next";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";
import prisma from "@/lib/prisma";
import z from "zod";
import { generateAuthenticationCodeURL } from "@/lib/api/emails";

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
    const response =  await prisma.emailAuthenticationCode.findFirst({
      where: {
        code
      }
    })
    if (response) {
      //Delete the code from database if not invited
      if (!response.invited) {
        const response = await prisma.emailAuthenticationCode.delete({
          where: {
            code
          }
        })
      };
      res.status(200).json({ message: "Verification successful" });
    } else {
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

    // Generate authcode URL
    const URL = await generateAuthenticationCodeURL(email, linkId, false);

    await sendVerificationEmail(email, URL);
    res.status(200).json({ message: "Invitation send successfully" });

  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}