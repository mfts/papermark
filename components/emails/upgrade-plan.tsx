import React from "react";

import {
  Body,
  Button,
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

interface UpgradePlanEmailProps {
  name: string | null | undefined;
}

const UpgradePlanEmail = ({ name }: UpgradePlanEmailProps) => {
  const previewText = `The document sharing infrastructure for the modern web`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Heading className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Heading>
            <Heading className="font-seminbold mx-0 mb-8 mt-4 p-0 text-center text-xl">
              Thanks for for upgrading to Papermark Pro!
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Hey{name && ` ${name}`}!
            </Text>
            <Text className="text-sm">
              My name is Marc, and I&apos;m the creator of Papermark. I wanted
              to personally reach out to thank you for upgrading to Papermark
              Pro!
            </Text>
            <Text className="text-sm leading-6 text-black">
              As you might already know, we are a bootstrapped and{" "}
              <Link
                href="https://github.com/mfts/papermark"
                target="_blank"
                className="font-medium text-emerald-500 no-underline"
              >
                open-source
              </Link>{" "}
              business. Your support means the world to us and helps us continue
              to build and improve Papermark.
            </Text>
            <Text className="text-sm leading-6 text-black">
              On the Pro plan, you now have access to:
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Custom domains and white-label branding
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Unlimited link views
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Unlimited document uploads
            </Text>
            <Text className="ml-1 text-sm leading-4 text-black">
              ◆ Invite your team members
            </Text>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/settings/domains`}
                style={{ padding: "12px 20px" }}
              >
                Set up your custom domain
              </Button>
            </Section>
            <Section>
              <Text className="text-sm">
                Let me know if you have any questions or feedback. I&apos;m
                always happy to help!
              </Text>
              <Text className="text-sm text-gray-400">Marc from Papermark</Text>
            </Section>
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

export default UpgradePlanEmail;
