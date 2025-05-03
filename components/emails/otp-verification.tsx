import React from "react";

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function OtpEmailVerification({
  email = "test@example.co",
  code = "123456",
  isDataroom = false,
  logo,
}: {
  email: string;
  code: string;
  isDataroom: boolean;
  logo?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your Email Verification Code</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <div className="mx-0 mb-8 mt-4 p-0 text-center">
              {logo ? (
                <Img
                  src={logo}
                  alt="Logo"
                  width="120"
                  height="36"
                  className="mx-auto"
                />
              ) : (
                <Text className="text-2xl font-normal">
                  <span className="font-bold tracking-tighter">Papermark</span>
                </Text>
              )}
            </div>
            <Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              Please confirm your email address
            </Heading>
            <Text className="mx-auto text-sm leading-6">
              Enter this code on the link verification page to view the{" "}
              {isDataroom ? "dataroom" : "document"}:
            </Text>
            <Section className="my-8">
              <div className="mx-auto w-fit rounded-xl px-6 py-3 text-center font-mono text-2xl font-semibold tracking-[0.25em]">
                {code}
              </div>
            </Section>
            <Text className="text-sm leading-6 text-black">
              This code expires in 10 minutes.
            </Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                This email was intended for{" "}
                <span className="text-black">{email}</span>. If you were not
                expecting this email, you can ignore this email. If you have any
                feedback or questions about this email, simply reply to it.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
