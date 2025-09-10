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

import { Footer } from "./shared/footer";

interface WelcomeEmailProps {
  name: string | null | undefined;
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
  const previewText = `The document sharing infrastructure for the modern web`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              Welcome to{" "}
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="text-sm">
              Thanks for signing up{name && `, ${name}`}!
            </Text>
            <Text className="text-sm">
              My name is Marc, and I&apos;m the founder of Papermark – the
              secure way to share documents and data rooms. I&apos;m excited to
              have you on board!
            </Text>
            <Text className="text-sm">
              Here are a few things you can do to get started:
            </Text>
            <ul className="list-inside list-disc text-sm">
              <li>Turn your documents into shareable links</li>
              <li>Create secure virtual data rooms</li>
              <li>
                Share your documents{" "}
                <span className="italic">(with custom domain)✨</span>
              </li>
              <li>Watch the page-by-page insights in real-time</li>
            </ul>
            <Section className="my-8 text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/welcome`}
                style={{ padding: "12px 20px" }}
              >
                Get Started
              </Button>
            </Section>

            <Section className="mt-4">
              <Text className="text-sm">
                If you have any questions or feedback just respond to this
                email.{" "}
                <Link
                  href="https://cal.link/papermark"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book a call
                </Link>{" "}
                to discuss your enterprise needs. I&apos;m always happy to help!
              </Text>

              <Text className="text-sm text-gray-400">Marc from Papermark</Text>
            </Section>
            <Footer />
            <Text className="flex gap-x-1 text-xs">
              <Link
                href="https://www.papermark.com/customers"
                target="_blank"
                className="text-xs text-gray-400"
              >
                Customer stories
              </Link>
              <Link
                href="https://x.com/papermarkio"
                target="_blank"
                className="text-xs text-gray-400"
                rel="noopener noreferrer"
              >
                · X/Twitter
              </Link>
              <Link
                href="https://www.linkedin.com/company/papermarkio"
                target="_blank"
                className="text-xs text-gray-400"
                rel="noopener noreferrer"
              >
                · LinkedIn
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
