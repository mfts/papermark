import BlockedEmailAttempt from "@/components/emails/blocked-email-attempt";
import { sendEmail } from "@/lib/resend";

export const sendBlockedEmailAttemptNotification = async ({
    to,
    cc,
    blockedEmail,
    linkName,
    resourceName,
    resourceType = "document",
    locationString,
}: {
    to: string;
    cc?: string[];
    blockedEmail: string;
    linkName: string;
    resourceName: string;
    resourceType?: "document" | "dataroom";
    locationString?: string;
}) => {
    const emailTemplate = BlockedEmailAttempt({
        blockedEmail,
        linkName,
        resourceName,
        resourceType,
        locationString,
    });
    try {
        await sendEmail({
            to,
            cc,
            subject: `Blocked email attempted to access your ${resourceType}: ${resourceName}`,
            react: emailTemplate,
            system: true,
            test: process.env.NODE_ENV === "development",
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}; 