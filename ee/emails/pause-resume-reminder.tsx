import {
  Body,
  Container,
  Head,
  Heading,
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

const baseUrl =
  process.env.NEXT_PUBLIC_MARKETING_URL || "https://www.papermark.com";

export default function PauseResumeReminderEmail({
  teamName = "Your Team",
  userName = "Team Member",
  resumeDate = "March 15, 2024",
  plan = "Pro",
  userRole = "Admin",
}: PauseResumeReminderEmailProps) {
  const previewText = `Your ${teamName} subscription will resume billing in 3 days`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/_static/papermark-logo.png`}
                width="160"
                height="48"
                alt="Papermark"
                className="mx-auto my-0"
              />
            </Section>

            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Subscription Resume Reminder
            </Heading>

            <Text className="text-[14px] leading-[24px] text-black">
              Hello {userName},
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              This is a friendly reminder that your <strong>{teamName}</strong>{" "}
              team's paused subscription will automatically resume billing in{" "}
              <strong>3 days</strong>.
            </Text>

            <Section className="my-[32px] rounded-lg border border-solid border-[#e5e7eb] bg-[#f9fafb] p-[24px]">
              <Text className="m-0 text-[14px] font-semibold leading-[24px] text-black">
                📅 Resume Details:
              </Text>
              <Text className="mb-0 mt-[12px] text-[14px] leading-[20px] text-[#6b7280]">
                <strong>Team:</strong> {teamName}
                <br />
                <strong>Plan:</strong> {plan}
                <br />
                <strong>Resume Date:</strong> {resumeDate}
                <br />
                <strong>Your Role:</strong> {userRole}
              </Text>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              <strong>What happens next?</strong>
            </Text>

            <Text className="text-[14px] leading-[20px] text-black">
              • Your subscription will automatically resume on{" "}
              <strong>{resumeDate}</strong>
              <br />
              • Billing will restart at your regular plan rate
              <br />
              • All features will be fully restored
              <br />• Your existing data and links remain unchanged
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              <strong>Need to make changes?</strong>
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              If you'd like to cancel your subscription instead of resuming, or
              need to update your billing information, you can manage your
              subscription in your account settings.
            </Text>

            <Section className="my-[32px] text-center">
              <Link
                className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={`${baseUrl}/settings/billing`}
              >
                Manage Subscription
              </Link>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              If you have any questions or concerns, please don't hesitate to
              reach out to our support team.
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              Best regards,
              <br />
              The Papermark Team
            </Text>

            <Section className="mt-[32px] border-t border-solid border-[#eaeaea] pt-[20px]">
              <Text className="text-[12px] leading-[16px] text-[#666]">
                This email was sent to you as an admin/manager of the {teamName}{" "}
                team on Papermark. If you believe this was sent in error, please
                contact our support team.
              </Text>

              <Text className="text-[12px] leading-[16px] text-[#666]">
                Papermark - The secure document sharing platform
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
