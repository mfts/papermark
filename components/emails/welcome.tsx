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
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 mt-4 mb-8 mx-0">
              Welcome to{" "}
              <span className="font-bold tracking-tighter">Papermark</span>
            </Heading>
            <Text className="text-sm">
              Thanks for signing up{name && `, ${name}`}!
            </Text>
            <Text className="text-sm">
              My name is Marc, and I&apos;m the creator of Papermark – the
              open-source DocSend alternative! I&apos;m excited to have you on
              board!
            </Text>
            <Text className="text-sm">
              Here are a few things you can do to get started:
            </Text>
            <Text className="text-sm">
              <ul className="list-disc list-inside text-sm">
                <li>Upload a document</li>
                <li>
                  Share a link{" "}
                  <span className="italic">(with your custom domain)✨</span>
                </li>
                <li>Watch the views come in real-time</li>
              </ul>
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-black rounded text-white text-xs font-semibold no-underline text-center"
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/welcome`}
                style={{ padding: "12px 20px" }}
              >
                Get Started
              </Button>
            </Section>
            <Section>
              <Text className="text-sm">
                If you would like to keep up to date, you can do:
              </Text>
              <Text className="text-sm">
                <ul className="list-disc list-inside text-sm">
                  <li>
                    Star the repo on{" "}
                    <Link
                      href="https://github.com/mfts/papermark"
                      target="_blank"
                    >
                      GitHub
                    </Link>
                  </li>
                  <li>
                    Follow the journey on{" "}
                    <Link href="https://twitter.com/mfts0" target="_blank">
                      Twitter
                    </Link>
                  </li>
                </ul>
              </Text>
            </Section>
            <Section className="mt-4">
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

export default WelcomeEmail;
