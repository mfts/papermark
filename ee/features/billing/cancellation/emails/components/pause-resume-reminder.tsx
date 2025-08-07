import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface PauseResumeReminderEmailProps {
  teamName?: string;
  userName?: string;
  resumeDate?: string;
  plan?: string;
  userRole?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://app.papermark.com";

export default function PauseResumeReminderEmail({
  teamName = "Your Team",
  resumeDate = "March 15, 2024",
  plan = "Pro",
}: PauseResumeReminderEmailProps) {
  const previewText = `${teamName}'s paused subscription will resume billing soon`;

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

            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-xl font-semibold">
              Subscription Resume Reminder
            </Text>
            <Text className="text-sm leading-6 text-black">
              This is a friendly reminder that your{" "}
              <span className="font-semibold">{teamName}</span> team's paused
              subscription will automatically resume billing in{" "}
              <span className="font-semibold">3 days</span>.
            </Text>

            <Text className="text-sm font-semibold leading-6 text-black">
              What happens next?
            </Text>
            <Text className="break-all text-sm leading-6 text-black">
              <ul>
                <li className="text-sm leading-6 text-black">
                  Your subscription will resume on{" "}
                  <span className="font-semibold">{resumeDate}</span>
                </li>
                <li className="text-sm leading-6 text-black">
                  Billing will restart at your{" "}
                  <span className="font-semibold">{plan}</span> plan rate
                </li>
                <li className="text-sm leading-6 text-black">
                  All features will be fully restored
                </li>
                <li className="text-sm leading-6 text-black">
                  Your existing data and links remain unchanged
                </li>
              </ul>
            </Text>

            <Text className="text-sm font-semibold leading-6 text-black">
              Need to make changes?
            </Text>
            <Text className="text-sm leading-6 text-black">
              If you'd like to cancel your subscription or need to update your
              billing information, you can manage your subscription in your{" "}
              <span className="font-semibold">account settings</span>.
            </Text>

            <Section className="my-8 text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${baseUrl}/settings/billing`}
                style={{ padding: "12px 20px" }}
              >
                Manage Subscription
              </Button>
            </Section>

            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                © {new Date().getFullYear()} Papermark, Inc.
              </Text>
              <Text className="text-xs">
                If you have any feedback or questions about this email, simply
                reply to it.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
