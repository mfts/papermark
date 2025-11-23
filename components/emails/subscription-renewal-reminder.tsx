import React from "react";

import {
  Body,
  Head,
  Html,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";

interface SubscriptionRenewalReminderEmailProps {
  customerName: string | null;
  renewalDate: string;
  amount: string;
  currency: string;
}

const SubscriptionRenewalReminderEmail = ({
  customerName,
  renewalDate,
  amount,
  currency,
}: SubscriptionRenewalReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Is your payment information up to date?</Preview>
      <Tailwind>
        <Body className="font-sans text-sm">
          <Text className="font-bold">
            Is your payment information up to date?
          </Text>
          <Text>Hi{customerName && ` ${customerName}`},</Text>
          <Text>
            Another year has come and gone, which means your annual Papermark
            subscription will automatically renew on {renewalDate}.
          </Text>
          <Text>
            We know many things can change in a year, so if you could make sure
            the payment method listed on your account is up to date, that would
            be dandy.
          </Text>
          <Text>
            Your subscription will renew for {amount} {currency.toUpperCase()}.
          </Text>
          <Text>
            If you need to update your billing details or have any questions,
            please visit your account settings.
          </Text>
          <Text>Best regards,</Text>
          <Text>The Papermark Team</Text>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SubscriptionRenewalReminderEmail;
