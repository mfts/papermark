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

export default function SlackIntegrationNotification({
  teamName,
  userEmail,
  settingsUrl,
}: {
  teamName: string;
  userEmail: string;
  settingsUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Slack integration has been added to your workspace</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              An integration has been added to your workspace
            </Text>
            <Text className="text-sm leading-6 text-black">
              The Slack integration has been added to your workspace{" "}
              <span className="font-semibold">{teamName}</span> on{" "}
              <span className="font-semibold">Papermark</span>.
            </Text>
            <Text className="text-sm leading-6 text-black">
              You can now receive notifications about document views, dataroom
              access and downloads directly in your Slack channels.
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={settingsUrl}
                style={{ padding: "12px 20px" }}
              >
                View installed integration
              </Button>
            </Section>
            <Text className="text-sm leading-6 text-black">
              or copy and paste this URL into your browser:
            </Text>
            <Text className="max-w-sm flex-wrap break-words font-medium text-purple-600 no-underline">
              {settingsUrl.replace(/^https?:\/\//, "")}
            </Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()}{" "}
                <a
                  href="https://www.papermark.com"
                  className="text-gray-400 no-underline hover:text-gray-400"
                  target="_blank"
                >
                  papermark.com
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
