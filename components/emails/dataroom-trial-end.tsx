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

interface DataroomTrialEnd {
  name: string | null | undefined;
}

const DataroomTrialEnd = ({ name }: DataroomTrialEnd) => {
  const previewText = `Upgrade to continue using data rooms`;

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
              Your dataroom trial has expired
            </Text>
            <Text className="text-sm leading-6 text-black">
              Hey{name && ` ${name}`}!
            </Text>
            <Text className="text-sm leading-6 text-black">
              Your Papermark dataroom trial has expired.{" "}
              <Link href={`https://app.papermark.io/settings/billing`}>
                Upgrade now
              </Link>{" "}
              to:
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Create new datarooms
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Share datarooms with your{" "}
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
              <span className="text-red-500">⚠️</span> Dataroom links and links
              with advanced access controls have been{" "}
              <span className="underline">disabled</span>.
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

export default DataroomTrialEnd;
