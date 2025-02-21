import { NextApiRequest, NextApiResponse } from "next";

import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { hashToken } from "@/lib/api/auth/token";
import { sendEmailChangeVerificationRequestEmail } from "@/lib/emails/send-mail-verification";
import { errorhandler } from "@/lib/errorHandler";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { CustomUser } from "@/lib/types";
import { trim } from "@/lib/utils";

import { authOptions } from "../auth/[...nextauth]";

const updateUserSchema = z.object({
  name: z.preprocess(trim, z.string().min(1).max(64)).optional(),
  email: z.preprocess(trim, z.string().email()).optional(),
  image: z.string().url().optional(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    // POST /api/account
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      throw new Error("Unauthorized");
    }
    const user = session.user as CustomUser;
    const { email, image, name } = await updateUserSchema.parseAsync(
      await req.body,
    );

    try {
      if (email && email !== session.user?.email) {
        const userWithEmail = await prisma.user.findUnique({
          where: {
            email,
          },
        });
        if (userWithEmail) {
          throw new Error("Email is already in use.");
        }
        const { success } = await ratelimit(6, "6 h").limit(
          `email-change-request:${user.id}`,
        );
        if (!success) {
          throw new Error(
            "You've requested too many email change requests. Please try again later.",
          );
        }
        const token = newId("email");
        const expiresIn = 15 * 60 * 1000;
        await prisma.verificationToken.create({
          data: {
            identifier: user.id,
            token: hashToken(token),
            expires: new Date(Date.now() + expiresIn),
          },
        });
        waitUntil(
          sendEmailChangeVerificationRequestEmail({
            email: user.email as string,
            newEmail: email,
            url: `${process.env.NEXTAUTH_URL}/auth/confirm-email-change?token=${token}`,
          }),
        );

        return res.status(201).json({ message: "success" });
      }

      const response = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          ...(name && { name }),
          ...(image && { image }),
        },
      });

      return res.status(201).json(response);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
