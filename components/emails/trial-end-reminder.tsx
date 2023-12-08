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

interface TrialEndReminderEmail {
  name: string | null | undefined;
}

const TrialEndReminderEmail = ({ name }: TrialEndReminderEmail) => {
  const previewText = `Upgrade to Papermark Pro`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 mt-4 mb-8 mx-0">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Heading>
            <Heading className="text-xl font-seminbold text-center p-0 mt-4 mb-8 mx-0">
              Your pro trial is almost over
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Hey{name && ` ${name}`}!
            </Text>
            <Text className="text-sm leading-6 text-black">
              Your Papermark Pro trial is almost over. If you want to continue
              enjoying the Pro features, please consider upgrading your plan.
            </Text>
            <Text className="text-sm leading-6 text-black">
              On the Pro plan, you have access to:
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Custom domains
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Team members
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Unlimited documents
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Large file uploads
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-black rounded text-white text-xs font-semibold no-underline text-center"
                href={`https://www.papermark.io/settings/billing`}
                style={{ padding: "12px 20px" }}
              >
                Upgrade your plan
              </Button>
            </Section>
            <Text className="text-sm font-semibold">
              <span className="text-red-500">⚠️</span> Links with custom domains
              will be <span className="underline text-red-500">disabled</span>{" "}
              after your trial.
            </Text>
            <Text className="text-sm text-gray-400">Marc from Papermark</Text>
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

export default TrialEndReminderEmail;
