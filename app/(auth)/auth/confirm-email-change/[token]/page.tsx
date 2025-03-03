import { redirect } from "next/navigation";

import NotFound from "@/pages/404";
import { VerificationToken } from "@prisma/client";
import { waitUntil } from "@vercel/functions";

import EmailUpdated from "@/components/emails/email-updated";

import { hashToken } from "@/lib/api/auth/token";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/resend";
import { CustomUser } from "@/lib/types";
import { subscribe, unsubscribe } from "@/lib/unsend";

import ConfirmEmailChangePageClient from "./page-client";
import { getSession } from "./utils";

export const runtime = "nodejs";

interface PageProps {
  params: { token: string };
}

export default async function ConfirmEmailChangePage(props: PageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <VerifyEmailChange {...props} />
    </div>
  );
}

const VerifyEmailChange = async ({ params: { token } }: PageProps) => {
  const tokenFound = await prisma.verificationToken.findUnique({
    where: {
      token: hashToken(token),
    },
  });

  if (!tokenFound || tokenFound.expires < new Date()) return <NotFound />;

  const session = await getSession();

  if (!session) {
    redirect(`/login?next=/auth/confirm-email-change/${token}`);
  }

  const currentUserId = (session.user as CustomUser).id;

  const data = await redis.get<{ email: string; newEmail: string }>(
    `email-change-request:user:${currentUserId}`,
  );

  if (!data) return <NotFound />;

  await unsubscribe(data.email);

  await prisma.user.update({
    where: {
      id: currentUserId,
    },
    data: {
      email: data.newEmail,
    },
  });

  waitUntil(
    Promise.all([
      deleteRequest(tokenFound),

      subscribe(data.newEmail),

      sendEmail({
        to: data.email,
        subject: "Your email address has been changed",
        system: true,
        react: EmailUpdated({
          oldEmail: data.email,
          newEmail: data.newEmail,
        }),
        test: process.env.NODE_ENV === "development",
      }),
    ]),
  );

  return <ConfirmEmailChangePageClient />;
};

const deleteRequest = async (tokenFound: VerificationToken) => {
  await Promise.all([
    prisma.verificationToken.delete({
      where: {
        token: tokenFound.token,
      },
    }),

    redis.del(`email-change-request:user:${tokenFound.identifier}`),
  ]);
};
