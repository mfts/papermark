import React from "react";

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

const VerificationCodeEmail = ({
  email = "user@example.com",
  code = "45PFSNUDYW",
}: {
  email?: string;
  code?: string;
}) => {
  return (
    <Html>
      <Head />
      <Preview>Your login code for Papermark: {code}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
            <Section className="mt-8">
              <Text className="text-2xl font-bold tracking-tighter">
                Papermark
              </Text>
            </Section>
            <Heading className="mx-0 my-7 p-0 text-xl font-semibold text-black">
              Your login code
            </Heading>
            <Text className="text-sm leading-6 text-neutral-600">
              Enter this code to sign in to your Papermark account:
            </Text>
            <Section className="my-6">
              <Text
                className="m-0 rounded-lg bg-neutral-100 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-black"
                style={{ fontFamily: "monospace", letterSpacing: "0.3em" }}
              >
                {code}
              </Text>
            </Section>
            <Text className="text-sm leading-6 text-neutral-600">
              This code will expire in 15 minutes.
            </Text>
            <Text className="mt-4 text-sm leading-5 text-neutral-500">
              If you didn&apos;t request this code, you can safely ignore this
              email.
            </Text>
            <Hr className="my-6" />
            <Section className="text-gray-400">
              <Text className="text-xs text-neutral-500">
                Papermark, Inc.
                <br />
                1111B S Governors Ave #28117
                <br />
                Dover, DE 19904
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerificationCodeEmail;
