import { Resend } from "resend";
import { CreateEmailOptions, CreateEmailResponse } from "resend/build/src/emails/interfaces";
import { log } from "./utils";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Define a new interface called SendEmailProps that extends the CreateEmailOptions interface and makes the 'from' property optional
interface SendEmailProps extends Omit<CreateEmailOptions, "from"> {
  from?: string;
}

// Define a new function called sendEmail that sends an email using the Resend API
export async function sendEmail(
  options: SendEmailProps
): Promise<CreateEmailResponse> {
  // Destructure the options object and provide a default value for the 'from' property
  const { from = "Marc from Papermark <marc@papermark.io>", to, subject, react, ...otherOptions } = options;
  try {
    // Send the email using the Resend API and return the response
    const response = await resend.emails.send({
      from,
      to,
      subject,
      react,
      ...otherOptions,
    } as CreateEmailOptions);
    return response;
  } catch (error) {
    // Log any errors and re-throw the error
    log(`Failed to send email. Error: \n\n ${error}`);
    throw error;
  }
}