import React from "react";

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";

import { Footer } from "@/components/emails/shared/footer";

interface SubscriptionRenewalReminderEmailProps {
  renewalDate: string;
  isOldAccount: boolean;
}

const SubscriptionRenewalReminderEmail = ({
  renewalDate,
  isOldAccount,
}: SubscriptionRenewalReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Papermark subscription renews soon</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans text-sm">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="text-2xl font-bold">
              Is your payment information up to date?
            </Text>
            <Text>
              Another year has come and gone, which means your annual Papermark
              subscription will automatically renew on {renewalDate}.
            </Text>
            <Text>
              We know many things can change in a year, so if you could ask your
              team admin to make sure the payment method listed on your account
              is up to date, that would be great.
            </Text>
            <Text>
              If you need to update your billing details or have any questions,
              please visit your{" "}
              <a
                href="https://app.papermark.com/settings/billing"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                billing settings
              </a>
              .
            </Text>
            {isOldAccount ? (
              <>
                <Hr />
                <Text className="text-gray-400">Papermark Team</Text>
              </>
            ) : (
              <Footer />
            )}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SubscriptionRenewalReminderEmail;
