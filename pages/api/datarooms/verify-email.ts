import { NextApiRequest, NextApiResponse } from "next";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";
import prisma from "@/lib/prisma";
import z, { ZodError } from "zod";
import { generateAuthenticationCode } from "@/lib/api/authentication";
import { checkPassword } from "@/lib/utils";
import { errorHandler } from "@/lib/errorHandler";

const bodySchema = z.object({
  email: z.string().email(),
  identifier: z.string(), //linkId if link, dataroomId if dataroom
  password: z.string().nullable(),
  emailProtected: z.boolean(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/dataroom/verify-email
    // Verify authcode
    try {
      const authenticationToken: string =
        req.query.authenticationCode !== "undefined"
          ? (req.query.authenticationCode as string)
          : "";
      const identifier = req.query.identifier as string;
      //If verification code is null but dataroom is not email protected send ok
      if (!authenticationToken) {
        const dataroom = await prisma.dataroom.findFirst({
          where: {
            id: identifier,
          },
        });
        if (!dataroom?.emailProtected) {
          return res.status(200).json({ message: "Verification successful" });
        }
      }
      //Check verification code in database
      const token = await prisma.verificationToken.findFirst({
        where: {
          token: authenticationToken,
          identifier: identifier,
        },
      });

      if (!token) {
        res.status(401).json({ message: "Unauthorized access" });
        return;
      }
      //Check the token's expiry
      if (Date.now() > token.expiresAt.getTime()) {
        //Delete the token if expired
        await prisma.verificationToken.delete({
          where: {
            token: authenticationToken,
          },
        });
        return res.status(401).json({ message: "Verification code expired" });
      }
      return res.status(200).json({ message: "Verification successful" });
    } catch (error) {
      errorHandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/dataroom/verify-email
    // Input validation
    let email: string;
    let identifier: string;
    let password: string | null;
    let emailProtected: boolean;
    try {
      ({ email, identifier, password, emailProtected } = bodySchema.parse(
        req.body,
      ));
    } catch (error) {
      return res.status(403).json({ message: `Invalid inputs` });
    }

    //Password validation
    if (password) {
      const dataroom = await prisma.dataroom.findFirst({
        where: {
          id: identifier,
        },
      });

      const isPasswordValid = await checkPassword(
        password,
        dataroom?.password || "",
      );

      if (isPasswordValid) {
        res.status(401).json({ message: "Incorrect password" });
        return;
      }
    }

    // Generate authcode
    const authenticationCode = await generateAuthenticationCode(
      12,
      identifier,
      "ONE-TIME",
    );
    const URL = `${process.env.NEXT_PUBLIC_BASE_URL}/view/dataroom/${identifier}?authenticationCode=${authenticationCode}`;

    //Send email only if emailProtected
    if (emailProtected) {
      await sendVerificationEmail(email, URL);
    }
    return res.status(200).json({ authenticationCode, URL });
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
