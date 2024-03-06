import { log, nanoid } from "@/lib/utils";
import { ReactElement, JSXElementConstructor } from "react";
import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const sendEmail = async ({
  to,
  subject,
  react,
  marketing,
  system,
  test,
}: {
  to: string;
  subject: string;
  react: ReactElement<any, string | JSXElementConstructor<any>>;
  marketing?: boolean;
  system?: boolean;
  test?: boolean;
}) => {
  if (!resend) {
    // Throw an error if resend is not initialized
    throw new Error("Resend not initialized");
  }

  try {
    const { data, error } = await resend.emails.send({
      from: marketing
        ? "Marc from Papermark <marc@ship.papermark.io>"
        : system
          ? "Papermark <system@papermark.io>"
          : "Marc from Papermark <marc@papermark.io>",
      to: test ? "delivered@resend.dev" : to,
      reply_to: marketing ? "marc@papermark.io" : undefined,
      subject,
      react,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    // Check if the email sending operation returned an error and throw it
    if (error) {
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
