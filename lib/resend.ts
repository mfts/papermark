import { JSXElementConstructor, ReactElement } from "react";

import { render } from "@react-email/components";
import { Resend } from "resend";

import { log, nanoid } from "@/lib/utils";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const sendEmail = async ({
  to,
  subject,
  react,
  marketing,
  system,
  verify,
  test,
  cc,
  scheduledAt,
  unsubscribeUrl,
}: {
  to: string;
  subject: string;
  react: ReactElement<any, string | JSXElementConstructor<any>>;
  marketing?: boolean;
  system?: boolean;
  verify?: boolean;
  test?: boolean;
  cc?: string | string[];
  scheduledAt?: string;
  unsubscribeUrl?: string;
}) => {
  if (!resend) {
    // Throw an error if resend is not initialized
    throw new Error("Resend not initialized");
  }

  const plainText = await render(react, { plainText: true });

  try {
    const { data, error } = await resend.emails.send({
      from: marketing
        ? "Marc from Papermark <marc@ship.papermark.io>"
        : system
          ? "Papermark <system@papermark.io>"
          : verify
            ? "Papermark <system@verify.papermark.io>"
            : !!scheduledAt
              ? "Marc Seitz <marc@papermark.io>"
              : "Marc from Papermark <marc@papermark.io>",
      to: test ? "delivered@resend.dev" : to,
      cc: cc,
      replyTo: marketing ? "marc@papermark.io" : undefined,
      subject,
      react,
      scheduledAt,
      text: plainText,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
        ...(unsubscribeUrl ? { "List-Unsubscribe": unsubscribeUrl } : {}),
      },
    });

    // Check if the email sending operation returned an error and throw it
    if (error) {
      log({
        message: `Resend returned error when sending email: ${error.name} \n\n ${error.message}`,
        type: "error",
        mention: true,
      });
      throw error;
    }

    // If there's no error, return the data
    return data;
  } catch (exception) {
    // Log and rethrow any caught exceptions for upstream handling
    log({
      message: `Unexpected error when sending email: ${exception}`,
      type: "error",
      mention: true,
    });
    throw exception; // Rethrow the caught exception
  }
};
