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

export default function AccessRequestNotification({
  requesterEmail = "user@example.com",
  contentName = "My Document",
  linkName = "Document Link",
  message,
  linkId = "abc123",
  contentType = "document",
}: {
  requesterEmail: string;
  contentName: string;
  linkName: string;
  message?: string;
  linkId: string;
  contentType: string;
}) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://app.papermark.com";

  return (
    <Html>
      <Head />
      <Preview>
        Access request for {contentType} {contentName}
      </Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              Access Request
            </Text>

            <Text className="text-sm leading-6 text-black">
              <span className="font-semibold">{requesterEmail}</span> has
              requested access to {contentType}{" "}
              <span className="font-semibold">{contentName}</span> from the link{" "}
              <span className="font-semibold">{linkName}</span>.
            </Text>

            {message && (
              <Text className="text-sm leading-6 text-black">
                <span className="font-semibold">Message:</span> &quot;{message}
                &quot;
              </Text>
            )}

            <Section className="my-8 text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${baseUrl}/access-requests`}
                style={{ padding: "12px 20px" }}
              >
                Review Access Request
              </Button>
            </Section>

            <Text className="text-sm leading-6 text-black">
              You can approve or deny this request in your link settings.
            </Text>

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
