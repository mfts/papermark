import { redirect } from "next/navigation";

import NotFound from "@/pages/404";
import { waitUntil } from "@vercel/functions";

import EmailUpdated from "@/components/emails/email-updated";

import { hashToken } from "@/lib/api/auth/token";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { CustomUser } from "@/lib/types";
import { generateChecksum } from "@/lib/utils/generate-checksum";

import ConfirmEmailChangePageClient from "./page-client";
import { getSession } from "./utils";

export const runtime = "nodejs";

interface ConfirmEmailChangePageProps {
  searchParams: {
    verification_url: string;
    checksum: string;
    email: string;
    newEmail: string;
  };
}

export default async function ConfirmEmailChangePage(
  props: ConfirmEmailChangePageProps,
) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <VerifyEmailChange {...props} />
    </div>
  );
}

const VerifyEmailChange = async ({
  searchParams: { checksum, verification_url, email, newEmail },
}: ConfirmEmailChangePageProps) => {
  const urlObj = new URL(verification_url);

  const isValidVerificationUrl = (url: string, checksum: string): boolean => {
    try {
      if (urlObj.origin !== process.env.NEXTAUTH_URL) return false;
      const expectedChecksum = generateChecksum(url);
      return checksum === expectedChecksum;
    } catch {
      return false;
    }
  };

  if (!isValidVerificationUrl(verification_url, checksum)) {
    return <NotFound />;
  }

  const token = urlObj.searchParams.get("token");

  if (!token) return <NotFound />;

  const hasToken = await prisma.verificationToken.findUnique({
    where: {
      token: hashToken(token),
    },
  });
  if (!hasToken || hasToken.expires < new Date()) {
    return <NotFound />;
  }
  const session = await getSession();
  const user = session?.user as CustomUser;

  if (!session) {
    redirect(`/login?next=/account/general`);
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      email: newEmail,
    },
  });

  waitUntil(
    sendEmail({
      to: email as string,
      subject: "Your email address has been changed",
      react: EmailUpdated({
        oldEmail: email,
        newEmail: newEmail,
      }),
      test: process.env.NODE_ENV === "development",
    }),
  );

  return <ConfirmEmailChangePageClient />;
};
