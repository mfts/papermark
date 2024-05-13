import { NextApiRequest, NextApiResponse } from "next";

import z from "zod";

import { sendVerificationEmail } from "@/lib/emails/send-email-verification";
import prisma from "@/lib/prisma";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().nullable(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/links/[linkId]/verify-email
    const { token, email } = req.body as { token: string; email: string };

    // Check verification code in database
    const verification = await prisma.verificationToken.findUnique({
      where: {
        token: token,
        identifier: email,
      },
    });

    if (!verification) {
      res.status(401).json({ message: "Unauthorized access" });
      return;
    }

    // Check the token's expiration date
    if (Date.now() > verification.expires.getTime()) {
      res.status(401).json({ message: "Token expired" });
      return;
    }

    // // remove token from database
    // await prisma.verificationToken.delete({
    //   where: {
    //     token: token,
    //   },
    // });

    res.status(200).json({ message: "Verification successful" });
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
