import { type ResolvedBrandLogo } from "@/ee/features/branding/lib/brand-logo";

import { getCustomEmail } from "@/lib/edge-config/custom-email";
import { readCachedBrandLogo } from "@/lib/redis/brand-logo-cache";
import { sendEmail } from "@/lib/resend";

import OtpEmailVerification from "@/components/emails/otp-verification";

export const sendOtpVerificationEmail = async (
  email: string,
  code: string,
  isDataroom: boolean = false,
  teamId: string,
) => {
  let logo: ResolvedBrandLogo | undefined;
  let from: string | undefined;

  const customEmail = await getCustomEmail(teamId);

  if (customEmail && teamId) {
    from = customEmail;
    logo = await readCachedBrandLogo(teamId);
  }

  const emailTemplate = OtpEmailVerification({
    email,
    code,
    isDataroom,
    logo,
  });

  try {
    await sendEmail({
      from,
      to: email,
      subject: `${code} is your verification code`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      verify: true,
    });
  } catch (e) {
    console.error(e);
  }
};
