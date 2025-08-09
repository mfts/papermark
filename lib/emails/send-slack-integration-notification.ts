import SlackIntegrationNotification from "@/components/emails/slack-integration-notification";

import { sendEmail } from "@/lib/resend";

export const sendSlackIntegrationNotification = async ({
    userEmail,
    teamName,
    settingsUrl,
}: {
    userEmail: string;
    teamName: string;
    settingsUrl: string;
}) => {
    try {
        await sendEmail({
            to: userEmail,
            subject: `Slack integration added to ${teamName}`,
            react: SlackIntegrationNotification({
                userEmail,
                teamName,
                settingsUrl,
            }),
            test: process.env.NODE_ENV === "development",
            system: true,
        });
    } catch (e) {
        console.error("Failed to send Slack integration notification:", e);
    }
}; 