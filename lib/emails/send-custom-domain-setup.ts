import CustomDomainSetupEmail from "@/components/emails/custom-domain-setup";

import { sendEmail } from "@/lib/resend";

export const sendCustomDomainSetupEmail = async (
  email: string,
  name?: string,
  currentPlan?: string,
  hasAccess?: boolean,
) => {
  const emailTemplate = CustomDomainSetupEmail({ 
    name: name || "there", 
    currentPlan: currentPlan || "Free",
    hasAccess: hasAccess || false,
  });
  
  try {
    await sendEmail({
      to: email,
      subject: "Your Papermark custom domain set up",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
}; 