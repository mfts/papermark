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
  Text,
  Tailwind,
  Link,
  Hr,
} from "@react-email/components";

export default function InvalidDomain({
  domain = "papermark.io",
  invalidDays = 14,
}: {
  domain: string;
  invalidDays: number;
}) {
  return (
    <Html>
      <Head />
      <Preview>Invalid Domain Configuration</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 mt-4 mb-8 mx-0">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Heading>
            <Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              {invalidDays >= 14
                ? `Invalid Domain Configuration`
                : `Finish configuring your domain`}
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Your domain <code className="text-purple-600">{domain}</code> for
              your Papermark account{" "}
              {invalidDays >= 14
                ? `has been invalid for ${invalidDays} days.`
                : `is still unconfigured.`}
            </Text>
            <Text className="text-sm leading-6 text-black">
              If your domain remains unconfigured for 30 days, it will be
              automatically deleted from Papermark. Please click the link below
              to configure your domain.
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="bg-black rounded text-white text-xs font-semibold no-underline text-center"
                href={`https://www.papermark.io/settings/domains`}
                style={{ padding: "12px 20px" }}
              >
                Configure domain
              </Button>
            </Section>
            <Text className="text-sm leading-6 text-black">
              If you do not want to keep this domain on Papermark, you can{" "}
              <Link
                href={`https://www.papermark.io/settings/domains`}
                className="font-medium text-blue-600 no-underline"
              >
                delete it
              </Link>{" "}
              or simply ignore this email.{" "}
              {invalidDays >= 14
                ? `To respect your inbox,${" "} 
                  ${
                    invalidDays < 28
                      ? `we will only send you one more email about this in ${
                          28 - invalidDays
                        } days.`
                      : `this will be the last time we will email you about this.`
                  }`
                : ""}
            </Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()}{" "}
                <a
                  href="https://www.papermark.io"
                  className="no-underline text-gray-400 hover:text-gray-400 visited:text-gray-400"
                  target="_blank"
                >
                  papermark.io
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
