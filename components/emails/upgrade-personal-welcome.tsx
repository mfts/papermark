import React from "react";

import { Body, Head, Html, Preview, Tailwind, Text } from "@react-email/components";

interface UpgradeCongratsEmailProps {
  name: string | null | undefined;
  planName?: string;
}

const UpgradeCongratsEmail = ({ name, planName = "Pro" }: UpgradeCongratsEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {planName}, {name}!</Preview>
      <Tailwind>
        <Body className="font-sans text-sm">
          <Text>Hi {name},</Text>
          <Text>
            I'm Iuliia, co-founder of Papermark. Thanks for upgrading! I'm thrilled 
            to have you on our {planName} plan.
          </Text>
          <Text>
            You now have access to advanced features. Any questions so far?? 
          </Text>
        
          <Text>
           
            Iuliia
          </Text>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default UpgradeCongratsEmail;