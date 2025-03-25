import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface ConfirmEmailChangeProps {
  email: string;
  newEmail: string;
  confirmUrl: string;
}

export function ConfirmEmailChange({
  email,
  newEmail,
  confirmUrl = "https://www.papermark.com",
}: ConfirmEmailChangeProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email address change</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded border border-solid border-gray-200 px-10 py-5">
            <Section>
              <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
                <span className="font-bold tracking-tighter">Papermark</span>
              </Text>
              <Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
                Your Papermark Email Change Confirmation Link
              </Heading>
            </Section>
            <Heading className="text-sm leading-6 text-black">
              Confirm your email address change
            </Heading>
            <Text className="text-sm leading-6 text-black">
              Follow this link to confirm the update to your email from{" "}
              <strong>{email}</strong> to <strong>{newEmail}</strong>.
            </Text>
            <Section className="my-8 text-center">
              <Link
                href={confirmUrl}
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                style={{ padding: "12px 20px" }}
              >
                Confirm email change
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              or copy and paste this URL into your browser:
            </Text>
            <Text className="max-w-sm flex-wrap break-words font-medium text-purple-600 no-underline">
              {confirmUrl.replace(/^https?:\/\//, "")}
            </Text>
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
                This email was intended for{" "}
                <span className="text-black">{email}</span>. If you were not
                expecting this email, you can ignore this email. If you have any
                feedback or questions about this email, simply reply to it.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default ConfirmEmailChange;
