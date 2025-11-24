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

import { Footer } from "../../../../../components/emails/shared/footer";

export default function DataroomViewerInvitation({
  dataroomName = "Example Data Room",
  senderEmail = "sender@example.com",
  url = "https://app.papermark.com/datarooms/123",
  recipientEmail = "recipient@example.com",
  customMessage,
}: {
  dataroomName: string;
  senderEmail: string;
  url: string;
  recipientEmail: string;
  customMessage?: string | null;
}) {
  return (
    <Html>
      <Head />
      <Preview>View dataroom on Papermark</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="font-seminbold mx-0 mb-8 mt-4 p-0 text-center text-xl">
              {`View ${dataroomName}`}
            </Text>
            <Text className="text-sm leading-6 text-black">Hey!</Text>
            <Text className="text-sm leading-6 text-black">
              You have been invited to view the{" "}
              <span className="font-semibold">{dataroomName}</span> dataroom on{" "}
              <span className="font-semibold">Papermark</span>.
              <br />
              The invitation was sent by{" "}
              <span className="font-semibold">{senderEmail}</span>.
            </Text>
            {customMessage ? (
              <Text
                className="text-sm leading-6 text-black"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {customMessage}
              </Text>
            ) : null}
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${url}`}
                style={{ padding: "12px 20px" }}
              >
                View the dataroom
              </Button>
            </Section>
            <Text className="text-sm text-black">
              or copy and paste this URL into your browser: <br />
              {`${url}`}
            </Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()} Papermark, Inc. All rights
                reserved.
              </Text>
              <Text className="text-xs">
                This email was intended for{" "}
                <span className="text-black">{recipientEmail}</span>. If you
                were not expecting this email, you can ignore this email. If you
                have any feedback or questions about this email, simply reply to
                it.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
