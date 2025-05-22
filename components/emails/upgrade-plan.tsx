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

interface UpgradePlanEmailProps {
  name: string | null | undefined;
  planType: string;
}

const UpgradePlanEmail = ({
  name,
  planType = "pro",
}: UpgradePlanEmailProps) => {
  const previewText = `The document sharing infrastructure for the modern web`;

  const features: any = {
    pro: [
      "Custom branding",
      "Unlimited link views",
      "Folder organization",
      "1 team member",
    ],
    business: [
      "Custom domains on document links",
      "Unlimited data rooms for multi-file sharing",
      "Advanced access controls",
      "3 team members",
    ],
    datarooms: [
      "Custom domains on data room links",
      "Unlimited data rooms",
      "Unlimited document uploads",
      "3 team members",
    ],
    "datarooms-plus": [
      "Custom domains on data room links",
      "Unlimited data rooms",
      "Q&A module",
      "5 team members",
    ],
  };

  const planTypeText = planType.toLowerCase();
  const planFeatures = features[planTypeText];

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
              Thanks for upgrading to Papermark {planType}!
            </Text>
            <Text className="text-sm leading-6 text-black">
              Hey{name && ` ${name}`}!
            </Text>
            <Text className="text-sm">
              My name is Marc, and I&apos;m the founder of Papermark. I wanted
              to personally reach out to thank you for upgrading to Papermark{" "}
              {planType}!
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
              On the {planType} plan, you now have access to:
            </Text>
            {planFeatures?.map(
              (feature: string, index: number) => (
                <Text key={index} className="ml-1 text-sm leading-4 text-black">
                  ◆ {feature}
                </Text>
              ),
              [],
            )}
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/${
                  planTypeText.includes("datarooms") ? "datarooms" : "documents"
                }`}
                style={{ padding: "12px 20px" }}
              >
                Share your{" "}
                {planTypeText.includes("datarooms")
                  ? "data rooms"
                  : "documents"}
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
                  href="https://www.papermark.com"
                  className="text-gray-400 no-underline visited:text-gray-400 hover:text-gray-400"
                  target="_blank"
                >
                  papermark.com
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
