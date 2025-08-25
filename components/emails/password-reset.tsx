import React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function PasswordResetEmail({
  resetUrl = "https://papermark.com/reset-password?token=example",
  name = "User",
}: {
  resetUrl: string;
  name: string;
}) {
  const previewText = `Reset your Papermark password`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[32px]">
              <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
                <span className="font-bold tracking-tighter">Papermark</span>
              </Text>
            </Section>

            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Reset your password
            </Heading>

            <Text className="text-[14px] leading-[24px] text-black">
              Hello {name},
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              We received a request to reset your password for your Papermark account.
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              Click the button below to set a new password:
            </Text>

            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-black px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={resetUrl}
              >
                Reset Password
              </Button>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              If you didn't request this password reset, you can safely ignore this email.
              This link will expire in 15 minutes for security reasons.
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              If the button doesn't work, you can also copy and paste the following link into your browser:
            </Text>

            <Text className="text-[12px] leading-[20px] text-gray-500 break-all">
              {resetUrl}
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              Best regards,
              <br />
              The Papermark Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}