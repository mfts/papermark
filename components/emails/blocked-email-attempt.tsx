import React from "react";

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function BlockedEmailAttempt({
  blockedEmail,
  linkName,
  resourceName,
  resourceType = "document",
  locationString,
}: {
  blockedEmail: string;
  linkName: string;
  resourceName: string;
  resourceType?: "document" | "dataroom";
  locationString?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Blocked email attempted to access your {resourceType}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              Blocked Email Attempted Access
            </Text>
            <Text className="text-sm leading-6 text-black">
              The blocked email <span className="font-semibold">{blockedEmail}</span> just attempted to access your {resourceType} <span className="font-semibold">{resourceName}</span> from the link <span className="font-semibold">{linkName}</span>.
              {locationString ? (
                <span>
                  {" "}
                  in <span className="font-semibold">{locationString}</span>
                </span>
              ) : null}
            </Text>
            <Text className="text-sm leading-6 text-black">
              This email is on your block list and was denied access. No further action is required.
            </Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()} {" "}
                <a
                  href="https://www.papermark.com"
                  className="text-gray-400 no-underline hover:text-gray-400"
                  target="_blank"
                >
                  papermark.com
                </a>
              </Text>
              <Text className="text-xs">
                If you have any feedback or questions about this email, simply reply to it. I&apos;d love to hear from you!
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
} 