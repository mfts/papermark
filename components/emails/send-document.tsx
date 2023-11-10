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

export default function SendDocument({
  senderEmail,
  message
}: {
  senderEmail: string;
  message: string
}) {
  var heading = "Papermark";
  if (!senderEmail.includes("papermark")) {
    const domain = senderEmail.split("@")[1].split(".")[0];
    heading = domain.split(".")[0];
  }
  return (
    <Html>
      <Head />
      <Preview>View Document</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 mt-4 mb-8 mx-0">
              <span className="font-bold tracking-tighter">{heading.charAt(0).toUpperCase() + heading.slice(1)}</span>
            </Heading>
            <Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              Document
            </Heading>
            <Text className="text-sm leading-6 text-black">
              {message ? message : "Please find the document in attachment"}
            </Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};