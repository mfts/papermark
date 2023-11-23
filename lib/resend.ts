import { nanoid } from "@/lib/utils";
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
  test,
}: {
  to: string;
  subject: string;
  react: ReactElement<any, string | JSXElementConstructor<any>>;
  marketing?: boolean;
  test?: boolean;
}) => {
  if (!resend) {
    console.log(
      "Resend is not configured. You need to add a RESEND_API_KEY in your .env file for emails to work."
    );
    return Promise.resolve();
  }
  return resend.emails.send({
    from: "Marc from Papermark <marc@videoauth.pro>",
    to: to,
    reply_to: marketing ? "marc@papermark.io" : undefined,
    subject,
    react,
    headers: {
      "X-Entity-Ref-ID": nanoid(),
    },
  });
};