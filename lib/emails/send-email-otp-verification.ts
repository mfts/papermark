import { getCustomEmail } from "@/lib/edge-config/custom-email";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

import OtpEmailVerification from "@/components/emails/otp-verification";

export const sendOtpVerificationEmail = async (
  email: string,
  code: string,
  isDataroom: boolean = false,
  teamId: string,
) => {
  let brand: { logo: string | null } | null = null;
  let from: string | undefined;

  const customEmail = await getCustomEmail(teamId);

  if (customEmail && teamId) {
    from = customEmail;

    // Get brand logo if we have a custom email
    brand = await prisma.brand.findUnique({
      where: { id: teamId },
      select: { logo: true },
    });
  }

  const emailTemplate = OtpEmailVerification({
    email,
    code,
    isDataroom,
    logo: brand?.logo ?? undefined,
  });

  try {
    await sendEmail({
      from,
      to: email,
      subject: `One-time passcode to access the ${isDataroom ? "dataroom" : "document"}`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      verify: true,
    });
  } catch (e) {
    console.error(e);
  }
};
