import { NextApiRequest, NextApiResponse } from "next";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";
import prisma from "@/lib/prisma";
import z, { ZodError } from "zod";
import { generateAuthenticationCode } from "@/lib/api/authentication";
import { checkPassword } from "@/lib/utils";

const bodySchema = z.object({
  email: z.string().email(),
  identifier: z.string(), //linkId if link, dataroomId if dataroom
  type: z.enum(["DOCUMENT", "PAGED DATAROOM"]),
  password: z.string().nullable(),
  emailProtected: z.boolean(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/verification/email-authcode
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
      res.status(200).json({ message: "Verification successful" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(403).json({
          message: "Invalid inputs",
          error: (error as Error).message,
        });
      }
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "POST") {
    // POST /api/verification/email-authcode
    // Input validation
    let email: string;
    let identifier: string;
    let type: "DOCUMENT" | "PAGED DATAROOM";
    let password: string | null;
    let emailProtected: boolean;
    try {
      ({ email, identifier, type, password, emailProtected } = bodySchema.parse(
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
      if (!dataroom) {
        const link = await prisma.link.findFirst({
          where: {
            id: identifier,
          },
        });

        if (!link) {
          res.status(404).json({ message: "Object not found" });
          return;
        }

        const isPasswordValid = await checkPassword(
          password,
          link.password || "",
        );

        if (!isPasswordValid) {
          res.status(401).json({ message: "Incorrect password" });
          return;
        }
      }

      const isPasswordValid = await checkPassword(
        password,
        dataroom?.password || "",
      );

      if (isPasswordValid) {
        res.status(401).json({ message: "Incorrect password" });
        return;
      }
    }

    let homeFolderId: string = "";

    // Generate authcode
    const authenticationCode = await generateAuthenticationCode(
      12,
      identifier,
      "ONE-TIME",
    );
    const URL =
      type === "DOCUMENT"
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/view/${identifier}?authenticationCode=${authenticationCode}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/view/dataroom/${identifier}?authenticationCode=${authenticationCode}`

    console.log(URL);
    //Send email only if emailProtected
    if (emailProtected) {
      await sendVerificationEmail(email, URL);
    }
    res.status(200).json({ authenticationCode, URL });
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
