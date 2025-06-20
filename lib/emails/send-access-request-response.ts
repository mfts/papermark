import AccessRequestResponse from "@/components/emails/access-request-response";
import { sendEmail } from "@/lib/resend";

interface SendAccessRequestResponseProps {
    to: string;
    requesterEmail: string;
    linkUrl: string;
}

export const sendAccessRequestResponse = async ({
    to,
    requesterEmail,
    linkUrl,
}: SendAccessRequestResponseProps) => {
    try {
        if (!to || !requesterEmail || !linkUrl) {
            throw new Error("Missing required fields for access request email");
        }

        const data = await sendEmail({
            to,
            subject: "Access Request Approved",
            react: AccessRequestResponse({
                requesterEmail,
                linkUrl,
            }),
            system: true,
            test: process.env.NODE_ENV === "development",
        });

        console.log("Email sent successfully:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Error sending access request email:", error);
        throw error;
    }
}; 