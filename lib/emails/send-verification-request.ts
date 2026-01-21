import { customAlphabet } from "nanoid";

import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

import LoginLink from "@/components/emails/verification-link";

// Generate a secure 20-character token using alphanumeric characters
const generateMagicLinkToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  20,
);

export const sendVerificationRequestEmail = async (params: {
  email: string;
  url: string;
}) => {
  const { url, email } = params;

  // Generate a short, unique token
  const token = generateMagicLinkToken();

  // Store the callback URL server-side with 24-hour expiration
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.magicLinkToken.create({
    data: {
      token,
      email,
      callbackUrl: url,
      expires: expiresAt,
    },
  });

  // Create simplified verification URL (under 100 characters)
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify?token=${token}`;

  const emailTemplate = LoginLink({
    url: verificationUrl,
    email,
    expiresAt,
  });

  try {
    await sendEmail({
      to: email as string,
      system: true,
      subject: "Your Papermark Login Link",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
