import AccessRequestNotification from "@/components/emails/access-request-notification";
import { sendEmail } from "@/lib/resend";

interface SendAccessRequestNotificationProps {
    to: string;
    requesterEmail: string;
    contentName: string;
    linkName: string;
    message?: string;
    linkId: string;
    contentType: string;
}

export const sendAccessRequestNotification = async ({
    to,
    requesterEmail,
    contentName,
    linkName,
    message,
    linkId,
    contentType,
}: SendAccessRequestNotificationProps) => {
    try {
        const data = await sendEmail({
            to,
            subject: `Access Request for ${contentType} ${contentName}`,
            react: AccessRequestNotification({
                requesterEmail,
                contentName,
                linkName,
                message,
                linkId,
                contentType,
            }),
            system: true,
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error };
    }
}; 