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
  Hr,
} from "@react-email/components";

export default function ViewedDocument({
  documentId = "123",
  documentName = "Pitchdeck",
  viewerEmail,
}: {
  documentId: string;
  documentName: string;
  viewerEmail: string | null;
}) {
  return (
    <Html>
      <Head />
      <Preview>See who visited your document</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="my-10 mx-auto p-5 w-[465px]">
            <Heading className="text-2xl font-normal text-center p-0 mt-4 mb-8 mx-0">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Heading>
            <Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              New Document Visitor
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Your document{" "}
              <span className="font-semibold">{documentName}</span> was just
              viewed by{" "}
              <span className="font-semibold">
                {viewerEmail ? `${viewerEmail}` : `someone`}
              </span>
              .
            </Text>
            <Text className="text-sm leading-6 text-black">
              You can get the detailed engagement insights like time-spent per
              page and total duration for this document on Papermark.
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="bg-black rounded text-white text-xs font-semibold no-underline text-center"
                href={`https://www.papermark.io/documents/${documentId}`}
                style={{ padding: "12px 20px" }}
              >
                See my document insights
              </Button>
            </Section>
            <Text className="text-sm leading-6 text-black">
              Stay informed, stay ahead with Papermark.
            </Text>
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
              <Text className="text-xs">
                To stop email notifications for this link, edit the link and
                uncheck &quot;Receive email notification&quot;.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
