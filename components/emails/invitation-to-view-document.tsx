import React from "react";
import {
  Body,
  Container,
  Button,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";

export default function InvitationToViewDocument({
  invitationURL,
}: {
  invitationURL: string;
}) {
  var heading = "Papermark";
  var domainName = "papermark";
  if (!invitationURL.includes("papermark")) {
    const domain = invitationURL.match(/https:\/\/([^/]+)\/(.+)/);
    if (domain) {
      domainName = domain[1];
      heading = domainName.split(".")[0];
    }
  }
  return (
    <Html>
      <Head />
      <Preview>View Document</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 mt-4 mb-8 mx-0">
              <span className="font-bold tracking-tighter">{heading}</span>
            </Heading>
            <Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              View Document
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Welcome to {domainName}. Please click the button below to view document.
            </Text>
            <Section className="my-8 text-center">
              <Button
                pX={20}
                pY={12}
                className="bg-black rounded text-white text-xs font-semibold no-underline text-center"
                href={invitationURL}
              >
                View Document
              </Button>
            </Section>
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
};