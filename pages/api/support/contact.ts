import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import ContactSupportEmail from "@/components/emails/contact-support";

import { authOptions } from "@/pages/api/auth/[...nextauth]";

import { sendEmail } from "@/lib/resend";
import { CustomUser } from "@/lib/types";
import { ratelimit } from "@/lib/utils";

const contactSupportSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  message: z.string().min(1, "Message is required").max(2000, "Message is too long"),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = session.user as CustomUser;
    
    // Rate limiting: max 5 support requests per hour per user
    const { success } = await ratelimit(5, "1 h").limit(
      `contact-support:${user.id}`,
    );
    
    if (!success) {
      return res.status(429).json({ 
        error: "Too many support requests. Please try again later." 
      });
    }

    const { subject, message } = contactSupportSchema.parse(req.body);

    const userName = user.name || "Papermark User";
    const userEmail = user.email || "";

    // Send email to support
    await sendEmail({
      to: "support@papermark.io",
      replyTo: userEmail,
      subject: `Support Request: ${subject}`,
      react: ContactSupportEmail({
        userEmail,
        userName,
        subject,
        message,
      }),
      test: process.env.NODE_ENV === "development",
      system: true,
    });

    return res.status(200).json({ 
      message: "Your support request has been sent successfully!" 
    });

  } catch (error) {
    console.error("Contact support error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors[0]?.message || "Invalid input" 
      });
    }

    return res.status(500).json({ 
      error: "Failed to send support request. Please try again." 
    });
  }
}