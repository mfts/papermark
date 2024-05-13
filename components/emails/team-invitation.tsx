import React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Text,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
} from "@react-email/components";

export default function TeamInvitation({
  senderName,
  senderEmail,
  teamName,
  url,
}: {
  senderName: string;
  senderEmail: string;
  teamName: string;
  url: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Join the team on Papermark</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="font-seminbold mx-0 mb-8 mt-4 p-0 text-center text-xl">
              {`Join ${teamName} on Papermark`}
            </Text>
            <Text className="text-sm leading-6 text-black">Hey!</Text>
            <Text className="text-sm leading-6 text-black">
              <span className="font-semibold">{senderName}</span> ({senderEmail}
              ) has invited you to the{" "}
              <span className="font-semibold">{teamName}</span> team on{" "}
              <span className="font-semibold">Papermark</span>.
            </Text>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${url}`}
                style={{ padding: "12px 20px" }}
              >
                Join the team
              </Button>
            </Section>
            <Text className="text-sm text-black">
              or copy and paste this URL into your browser: <br />
              {`${url}`}
            </Text>
            <Text className="text-sm text-gray-400">Marc from Papermark</Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()}{" "}
                <a
                  href="https://www.papermark.io"
                  className="text-gray-400 no-underline visited:text-gray-400 hover:text-gray-400"
                  target="_blank"
                >
                  papermark.io
                </a>
              </Text>
              <Text className="text-xs">
                If you have any feedback or questions about this email, simply
                reply to it. I&apos;d love to hear from you!
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
