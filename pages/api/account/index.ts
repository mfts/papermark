import { NextApiRequest, NextApiResponse } from "next";

import { waitUntil } from "@vercel/functions";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { hashToken } from "@/lib/api/auth/token";
import { sendEmailChangeVerificationRequestEmail } from "@/lib/emails/send-mail-verification";
import { errorhandler } from "@/lib/errorHandler";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { ratelimit, redis } from "@/lib/redis";
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
    const sessionUser = session.user as CustomUser;
    const { email, image, name } = await updateUserSchema.parseAsync(
      await req.body,
    );

    try {
      if (email && email !== sessionUser.email) {
        const userWithEmail = await prisma.user.findUnique({
          where: {
            email,
          },
        });
        if (userWithEmail) {
          throw new Error("Email is already in use.");
        }
        const { success } = await ratelimit(6, "6 h").limit(
          `email-change-request:${sessionUser.id}`,
        );
        if (!success) {
          throw new Error(
            "You've requested too many email change requests. Please try again later.",
          );
        }
        const token = randomBytes(32).toString("hex");
        const expiresIn = 15 * 60 * 1000;

        await prisma.verificationToken.create({
          data: {
            identifier: sessionUser.id,
            token: hashToken(token),
            expires: new Date(Date.now() + expiresIn),
          },
        });

        await redis.set(
          `email-change-request:user:${sessionUser.id}`,
          {
            email: sessionUser.email,
            newEmail: email,
          },
          {
            px: expiresIn,
          },
        );

        waitUntil(
          sendEmailChangeVerificationRequestEmail({
            email: sessionUser.email as string,
            newEmail: email,
            url: `${process.env.NEXTAUTH_URL}/auth/confirm-email-change/${token}`,
          }),
        );

        return res.status(200).json({ message: "success" });
      }

      const response = await prisma.user.update({
        where: {
          id: sessionUser.id,
        },
        data: {
          ...(name && { name }),
          ...(image && { image }),
        },
      });

      return res.status(200).json({ message: "success" });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
