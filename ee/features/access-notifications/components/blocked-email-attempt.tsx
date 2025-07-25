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
  timestamp,
  locationString,
  accessType,
}: {
  blockedEmail: string;
  linkName: string;
  resourceName: string;
  resourceType?: "document" | "dataroom";
  timestamp?: string;
  locationString?: string;
  accessType?: "global" | "allow" | "deny";
}) {
  const accessTypeTexts = {
    global:
      "This email is on your global block list and was denied access. No further action is required.",
    allow:
      "This email is not on your link's allow list and was denied access. No further action is required.",
    deny: "This email is on your link's block list and was denied access. No further action is required.",
    default: "This email was denied access. No further action is required.",
  };

  const accessTypeText = accessType
    ? accessTypeTexts[accessType]
    : accessTypeTexts.default;

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
              A blocked email attempted to access your {resourceType}:
            </Text>
            <Text className="break-all text-sm leading-6 text-black">
              <ul>
                <li className="text-sm leading-6 text-black">
                  <span className="font-semibold">Email address:</span>{" "}
                  {blockedEmail}
                </li>
                <li className="text-sm leading-6 text-black">
                  <span className="font-semibold">Time:</span>{" "}
                  {timestamp || new Date().toLocaleString()}
                </li>
                <li className="text-sm leading-6 text-black">
                  <span className="font-semibold">
                    {resourceType === "dataroom" ? "Dataroom" : "Document"}{" "}
                    name:
                  </span>{" "}
                  {resourceName}
                </li>
                <li className="text-sm leading-6 text-black">
                  <span className="font-semibold">Link name:</span> {linkName}
                </li>
              </ul>
            </Text>
            <Text className="mt-4 text-sm leading-6 text-black">
              {accessTypeText}
            </Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()} Papermark, Inc.
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
