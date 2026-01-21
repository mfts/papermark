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

const PasswordResetEmail = ({
  url = "https://www.papermark.com/reset-password?token=xxx",
}: {
  url: string;
}) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
            <Section className="mt-8">
              <Text className="text-2xl font-bold tracking-tighter">
                Papermark
              </Text>
            </Section>
            <Heading className="mx-0 my-7 p-0 text-lg font-medium text-black">
              Reset Your Password
            </Heading>
            <Text className="text-sm leading-6 text-black">
              We received a request to reset your password for your Papermark
              account.
            </Text>
            <Text className="text-sm leading-6 text-black">
              Click the button below to set a new password:
            </Text>
            <Section className="my-8">
              <Link
                className="rounded-lg bg-black px-6 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={url}
              >
                Reset Password
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              Or copy and paste this URL into your browser:
            </Text>
            <Text className="max-w-sm flex-wrap break-words font-medium text-purple-600 no-underline">
              {url.replace(/^https?:\/\//, "")}
            </Text>
            <Text className="mt-8 text-sm leading-6 text-gray-500">
              This link will expire in 1 hour. If you didn&apos;t request a
              password reset, you can safely ignore this email. Your password
              will remain unchanged.
            </Text>
            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PasswordResetEmail;
