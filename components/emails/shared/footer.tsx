import { Hr, Section, Text } from "@react-email/components";

export const Footer = ({
  withAddress = false,
  footerText = "If you have any feedback or questions about this email, simply reply to it. I'd love to hear from you!",
}: {
  withAddress?: boolean;
  footerText?: string | React.ReactNode;
}) => {
  return (
    <>
      <Hr />
      <Section className="text-gray-400">
        <Text className="text-xs">
          © {new Date().getFullYear()} Papermark, Inc. All rights reserved.{" "}
          {withAddress && (
            <>
              <br />
              1111B S Governors Ave #28117, Dover, DE 19904
            </>
          )}
        </Text>
        <Text className="text-xs">{footerText}</Text>
      </Section>
    </>
  );
};
