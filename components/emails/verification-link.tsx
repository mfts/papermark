import React from "react";

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { Footer } from "./shared/footer";

const formatExpirationTime = (expiresAt: Date): string => {
  return expiresAt.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

const VerificationLinkEmail = ({
  url = "https://app.papermark.com/verify?token=example",
  email = "user@example.com",
  expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000),
}: {
  url: string;
  email?: string;
  expiresAt?: Date;
}) => {
  const requestedAt = new Date();

  return (
    <Html>
      <Head />
      <Preview>Your Papermark Login Link - Sign in to your account</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
            <Section className="mt-8">
              <Text className="text-2xl font-bold tracking-tighter">
                Papermark
              </Text>
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Sign in to Papermark
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Hi there,
            </Text>
            <Text className="text-sm leading-6 text-black">
              We received a request to sign in to your Papermark account
              associated with <strong>{email}</strong>. Click the button below
              to securely sign in.
            </Text>
            <Section className="my-8 text-center">
              <Link
                className="rounded-lg bg-black px-6 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={url}
              >
                Sign in to Papermark
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              Or copy and paste this URL into your browser:
            </Text>
            <Text className="max-w-sm flex-wrap break-words font-medium text-purple-600 no-underline">
              {url}
            </Text>
            <Section className="mt-8 rounded-lg bg-neutral-50 p-4">
              <Text className="m-0 text-xs leading-5 text-neutral-600">
                <strong>Security Information:</strong>
              </Text>
              <Text className="m-0 mt-2 text-xs leading-5 text-neutral-600">
                • This link was requested on{" "}
                {requestedAt.toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </Text>
              <Text className="m-0 mt-1 text-xs leading-5 text-neutral-600">
                • This link expires in 24 hours (
                {formatExpirationTime(expiresAt)})
              </Text>
              <Text className="m-0 mt-1 text-xs leading-5 text-neutral-600">
                • If you didn&apos;t request this link, you can safely ignore
                this email. Your account remains secure.
              </Text>
            </Section>
            <Footer
              withAddress={true}
              footerText="This is an automated security email from Papermark. If you have any questions, simply reply to this email."
            />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerificationLinkEmail;
