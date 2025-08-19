import React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function ConversationNotification({
  conversationTitle,
  dataroomName,
  senderEmail,
  url,
  unsubscribeUrl,
}: {
  conversationTitle: string;
  dataroomName: string;
  senderEmail: string;
  url: string;
  unsubscribeUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Conversation update available</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="font-seminbold mx-0 mb-8 mt-4 p-0 text-center text-xl">
              {`New message in ${dataroomName}`}
            </Text>
            <Text className="text-sm leading-6 text-black">
              A new message has been added to the conversation{" "}
              <span className="font-semibold">{conversationTitle}</span> in the
              dataroom <span className="font-semibold">{dataroomName}</span> on
              Papermark.
            </Text>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${url}`}
                style={{ padding: "12px 20px" }}
              >
                View the conversation
              </Button>
            </Section>
            <Text className="text-sm text-black">
              or copy and paste this URL into your browser: <br />
              {`${url}`}
            </Text>
            <Text className="text-sm text-gray-400">Papermark</Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()} Papermark, Inc.
              </Text>
              <Text className="text-xs">
                You received this email from{" "}
                <span className="font-semibold">{senderEmail}</span> because you
                turned on notifications for the conversation{" "}
                <span className="font-semibold">{conversationTitle}</span> in
                the dataroom{" "}
                <span className="font-semibold">{dataroomName}</span> on
                Papermark. If you have any feedback or questions about this
                email, simply reply to it. To unsubscribe from updates about
                this dataroom,{" "}
                <a
                  href={unsubscribeUrl}
                  className="text-gray-400 underline underline-offset-2 hover:text-gray-400"
                >
                  click here
                </a>
                .
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
