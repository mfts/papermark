import React from "react";

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { Footer } from "./shared/footer";

const VerificationLinkEmail = ({
  url = "https://app.papermark.com/auth/email/user@example.com/45PFSNUDYW/abc-123",
  email = "user@example.com",
  code = "45PFSNUDYW",
}: {
  url: string;
  email?: string;
  code?: string;
}) => {
  return (
    <Html>
      <Head />
      <Preview>To login to Papermark, follow this link {url}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
            <Section className="mt-8">
              <Text className="text-2xl font-bold tracking-tighter">
                Papermark
              </Text>
            </Section>
            <Heading className="mx-0 my-7 p-0 text-xl font-semibold text-black">
              Your login code for Papermark
            </Heading>
            <Section className="my-8">
              <Link
                className="rounded-lg bg-black px-6 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={url}
              >
                Login to Papermark
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-neutral-600">
              This link and code will only be valid for the next 15 minutes. If
              the link does not work, you can use the login verification code
              directly:
            </Text>
            <Section className="my-4">
              <Text
                className="m-0 w-fit rounded-lg bg-neutral-100 px-2 py-1 text-base font-bold tracking-wider text-black"
                style={{ fontFamily: "monospace" }}
              >
                {code}
              </Text>
            </Section>
            <Text className="text-sm leading-5 text-neutral-500">
              If you didn&apos;t try to log in, you can safely ignore this
              email.
            </Text>
            <Hr />
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

export default VerificationLinkEmail;
