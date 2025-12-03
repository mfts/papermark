import React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { Footer } from "./shared/footer";

export default function SignedNDA({
  viewId = "123",
  documentId,
  dataroomId,
  agreementName = "NDA Agreement",
  linkName = "Document Link",
  viewerEmail,
  viewerName,
  locationString,
}: {
  viewId: string;
  documentId?: string;
  dataroomId?: string;
  agreementName: string;
  linkName: string;
  viewerEmail: string | null;
  viewerName?: string | null;
  locationString?: string;
}) {
  // Link to document or dataroom page where they can download the certificate
  const resourceUrl = dataroomId
    ? `https://app.papermark.com/datarooms/${dataroomId}`
    : documentId
      ? `https://app.papermark.com/documents/${documentId}`
      : `https://app.papermark.com`;
  const resourceType = dataroomId ? "dataroom" : "document";
  const displayName = viewerName || viewerEmail || "someone";

  return (
    <Html>
      <Head />
      <Preview>Someone signed your NDA agreement</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              NDA Agreement Signed
            </Text>
            <Text className="text-sm leading-6 text-black">
              <span className="font-semibold">{displayName}</span> has just signed
              the agreement{" "}
              <span className="font-semibold">{agreementName}</span>
              {locationString ? (
                <span>
                  {" "}
                  from <span className="font-semibold">{locationString}</span>
                </span>
              ) : null}{" "}
              via the link <span className="font-semibold">{linkName}</span>.
            </Text>
            <Text className="text-sm leading-6 text-black">
              You can download the NDA completion certificate as proof of
              agreement acceptance.
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={resourceUrl}
                style={{ padding: "12px 20px" }}
              >
                View {resourceType === "dataroom" ? "Dataroom" : "Document"} & Download Certificate
              </Button>
            </Section>
            <Footer
              footerText={
                <>
                  If you have any feedback or questions about this email, simply
                  reply to it. I&apos;d love to hear from you!
                </>
              }
            />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

