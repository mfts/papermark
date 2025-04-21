import ConversationNotification from "@/ee/features/conversations/emails/components/conversation-notification";

import { sendEmail } from "@/lib/resend";

export const sendConversationNotification = async ({
  dataroomName,
  conversationTitle,
  senderEmail,
  to,
  url,
  unsubscribeUrl,
}: {
  dataroomName: string;
  conversationTitle: string;
  senderEmail: string;
  to: string;
  url: string;
  unsubscribeUrl: string;
}) => {
  try {
    await sendEmail({
      to: to,
      replyTo: senderEmail,
      subject: `New message in ${dataroomName}`,
      react: ConversationNotification({
        senderEmail,
        conversationTitle,
        dataroomName,
        url,
        unsubscribeUrl,
      }),
      test: process.env.NODE_ENV === "development",
      system: true,
      unsubscribeUrl,
    });
  } catch (e) {
    console.error(e);
  }
};
