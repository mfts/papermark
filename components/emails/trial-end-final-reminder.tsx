import React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface TrialEndFinalReminderEmail {
  name: string | null | undefined;
}

const TrialEndFinalReminderEmail = ({ name }: TrialEndFinalReminderEmail) => {
  const previewText = `Upgrade to Papermark Pro`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="font-seminbold mx-0 mb-8 mt-4 p-0 text-center text-xl">
              Your pro trial expires in 24 hours
            </Text>
            <Text className="text-sm leading-6 text-black">
              Hey{name && ` ${name}`}!
            </Text>
            <Text className="text-sm leading-6 text-black">
              Your Papermark Pro trial expires in 24 hours.{" "}
              <Link href={`https://app.papermark.io/settings/billing`}>
                Upgrade now
              </Link>{" "}
              to:
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Send documents with your{" "}
              <span className="font-bold">custom domain</span>
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Invite your <span className="font-bold">team members</span>
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Share <span className="font-bold">unlimited documents</span>
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Upload <span className="font-bold">large</span> files
            </Text>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`https://app.papermark.io/settings/billing`}
                style={{ padding: "12px 20px" }}
              >
                Upgrade now
              </Button>
            </Section>
            <Text className="text-sm font-semibold">
              <span className="text-red-500">⚠️</span> Links with custom domains
              will be <span className="underline">disabled</span> after your
              trial.
            </Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()}{" "}
                <a
                  href="https://www.papermark.io"
                  className="text-gray-400 no-underline visited:text-gray-400 hover:text-gray-400"
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

export default TrialEndFinalReminderEmail;
