import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function ContactSupportEmail({
  userEmail = "user@example.com",
  userName = "User",
  subject = "Support Request",
  message = "Support message content",
}: {
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>New support request from {userEmail}</Preview>

      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] p-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">Papermark</span>
            </Text>
            <Text className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              New Support Request
            </Text>
            
            <Text className="text-sm leading-6 text-black">
              <strong>From:</strong> {userName} ({userEmail})
            </Text>
            
            <Text className="text-sm leading-6 text-black">
              <strong>Subject:</strong> {subject}
            </Text>
            
            <Hr className="my-4" />
            
            <Text className="text-sm leading-6 text-black">
              <strong>Message:</strong>
            </Text>
            
            <Text className="text-sm leading-6 text-black whitespace-pre-wrap">
              {message}
            </Text>
            
            <Hr className="my-4" />
            
            <Text className="text-xs text-gray-500">
              This message was sent from the Papermark support form.
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
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}