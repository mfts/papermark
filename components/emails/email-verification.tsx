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

const EmailVerificationEmail = ({
  url = "https://www.papermark.com/verify-email?token=xxx",
}: {
  url: string;
}) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
            <Section className="mt-8">
              <Text className="text-2xl font-bold tracking-tighter">
                Papermark
              </Text>
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Verify Your Email Address
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Welcome to Papermark!
            </Text>
            <Text className="text-sm leading-6 text-black">
              Please click the button below to verify your email address and
              activate your account.
            </Text>
            <Section className="my-8">
              <Link
                className="rounded-lg bg-black px-6 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={url}
              >
                Verify Email Address
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              Or copy and paste this URL into your browser:
            </Text>
            <Text className="max-w-sm flex-wrap break-words font-medium text-purple-600 no-underline">
              {url.replace(/^https?:\/\//, "")}
            </Text>
            <Text className="mt-8 text-sm leading-6 text-gray-500">
              This link will expire in 24 hours. If you didn&apos;t create an
              account with Papermark, you can safely ignore this email.
            </Text>
            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailVerificationEmail;
