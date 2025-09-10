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

import { Footer } from "./shared/footer";

export default function DataroomViewerInvitation({
  dataroomName = "Example Data Room",
  senderEmail = "sender@example.com",
  url = "https://app.papermark.com/datarooms/123",
}: {
  dataroomName: string;
  senderEmail: string;
  url: string;
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
            <Text className="text-sm text-gray-400">Papermark</Text>
            <Footer
              footerText="If you have any feedback or questions about this email, simply
                reply to it."
            />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
