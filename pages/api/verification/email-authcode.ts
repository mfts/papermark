import { NextApiRequest, NextApiResponse } from "next";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";
import prisma from "@/lib/prisma";
import z from "zod";
import { generateAuthenticationCode } from "@/lib/api/authentication";
import { checkPassword } from "@/lib/utils";

const bodySchema = z.object({
  email: z.string().email(),
  identifier: z.string(),    //linkId if link, dataroomId if dataroom
  type: z.enum(["DOCUMENT", "PAGED DATAROOM", "HIERARCHICAL DATAROOM"]),
  password: z.string()
})

const authSchema = z.object({
  authenticationCode: z.string().max(20),
  identifier: z.string().max(40)
})

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/verification/email-authcode 
    // Verify authcode
    let authenticationCode: string = "";
    let identifier: string = "";
    try {
      ({ authenticationCode, identifier } = authSchema.parse(req.query));
    } catch (error) {
      return res.status(409).json({
        message: "Invalid inputs",
        error: (error as Error).message,
      });
    }

    //Check verification code in database 
    const verificationCode = await prisma.authenticationCode.findFirst({
      where: {
        code: authenticationCode,
        identifier
      }
    });

    if (!verificationCode) {
      res.status(401).json({ message: "Unauthorized access" });
      return;
    }

    //Delete the code if not permanent
    if (!verificationCode.permanent) {
      try {
        await prisma.authenticationCode.delete({
          where: {
            code: authenticationCode,
          }
        })
      } catch (error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: (error as Error).message,
        });
      }
    }
    res.status(200).json({ message: "Verification successful" });
  } else if (req.method === "POST") {
    // POST /api/verification/email-authcode

    // Input validation
    let email: string;
    let identifier: string;
    let type: "DOCUMENT" | "PAGED DATAROOM" | "HIERARCHICAL DATAROOM";
    let password: string;
    try {
      const parsedBody = bodySchema.parse(req.body);
      email = parsedBody.email;
      identifier = parsedBody.identifier;
      type = parsedBody.type;
      password = parsedBody.password
    } catch (error) {
      res.status(409).json({ message: `Invalid inputs` })
      return;
    }

    //Password validation
    if (password) {
      const dataroom = await prisma.dataroom.findFirst({
        where: {
          id: identifier
        }
      })
      if (!dataroom) {
        const link = await prisma.link.findFirst({
          where: {
            id: identifier
          }
        })

        if (!link) {
          res.status(404).json({message: "Object not found"});
          return;
        }

        const isPasswordValid = await checkPassword(password, link.password || "");

        if (!isPasswordValid) {
          res.status(401).json({message: "Incorrect password"});
          return;
        }
      }

      const isPasswordValid = await checkPassword(password, dataroom?.password || "");

      if (isPasswordValid) {
        res.status(401).json({message: "Incorrect password"});
        return;
      }
    }

    let homeFolderId: string = "";
    if (type === "HIERARCHICAL DATAROOM") {
      const folder = await prisma.dataroomFolder.findFirst({
        where: {
          dataroomId: identifier,
          parentFolderId: null
        },
        select: {
          id: true
        }
      })
      if (!folder) {
        res.status(404).json({ message: "Home folder doesn't exists" })
        return;
      }
      homeFolderId = folder.id;
    }

    // Generate authcode
    const authenticationCode = await generateAuthenticationCode(12, email, identifier, "DATAROOM", "ONE-TIME");
    const URL = type === "DOCUMENT"
      ? `${process.env.NEXTAUTH_URL}/view/${identifier}?authenticationCode=${authenticationCode}`
      : type === "PAGED DATAROOM"
        ? `${process.env.NEXTAUTH_URL}/view/dataroom/paged/${identifier}?authenticationCode=${authenticationCode}`
        : `${process.env.NEXTAUTH_URL}/view/dataroom/hierarchical/${identifier}/${homeFolderId}?authenticationCode=${authenticationCode}`;

    await sendVerificationEmail(email, URL);
    res.status(200).json({ authenticationCode });

  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}