import {
  Body,
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

export function EmailUpdated({
  oldEmail = "name@example.com",
  newEmail = "name@example.com",
}: {
  oldEmail: string;
  newEmail: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your email address has been updated</Preview>

      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              Your email address has been changed
            </Text>
            <Text className="text-sm leading-6 text-black">
              The email address for your Papermark account has been changed from{" "}
              <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.
            </Text>
            <Text className="text-sm leading-6 text-black">
              If you did not make this change, please contact our support team
              or{" "}
              <Link href="https://app.agrowy.com/account/general">
                update your email address
              </Link>
              .
            </Text>
            <Text className="text-sm leading-6 text-black">
              This message is being sent to your old email address only.
            </Text>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()}{" "}
                <a
                  href="https://www.agrowy.com"
                  className="text-gray-400 no-underline visited:text-gray-400 hover:text-gray-400"
                  target="_blank"
                >
                  agrowy.com
                </a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default EmailUpdated;
