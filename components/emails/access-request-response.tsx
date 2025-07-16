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

export default function AccessRequestResponse({
  requesterEmail = "user@example.com",
  linkUrl = "https://app.papermark.com",
}: {
  requesterEmail: string;
  linkUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your access request has been approved</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              Access Request Approved
            </Text>

            <Text className="text-sm leading-6 text-black">
              Hi {requesterEmail},
            </Text>

            <Text className="text-sm leading-6 text-black">
              Your request to access document has been{" "}
              <span className="font-semibold text-green-600">approved</span>.
            </Text>

            <Text className="text-sm leading-6 text-black">
              You can now access the content using the link below.
            </Text>

            <Section className="my-8 text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={linkUrl}
                style={{ padding: "12px 20px" }}
              >
                Access Content
              </Button>
            </Section>

            <Hr />

            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()}{" "}
                <a
                  href="https://www.papermark.com"
                  className="text-gray-400 no-underline visited:text-gray-400 hover:text-gray-400"
                  target="_blank"
                >
                  papermark.com
                </a>
              </Text>
              <Text className="text-xs">
                This is an automated notification about your access request.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
