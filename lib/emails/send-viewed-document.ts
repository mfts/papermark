import { sendEmail } from "@/lib/resend";
import ViewedDocumentEmail from "@/components/emails/viewed-document";
import prisma from "@/lib/prisma";

export const sendViewedDocumentEmail = async ({
  ownerId,
  documentId,
  documentName,
  viewerEmail,
}: {
  ownerId: string;
  documentId: string;
  documentName: string;
  viewerEmail: string | null;
}) => {
  const emailTemplate = ViewedDocumentEmail({
    documentId,
    documentName,
    viewerEmail,
  });
  try {
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { email: true },
    });

    if (!owner || !owner.email) {
      throw new Error("Document Owner not found");
    }

    const data = await sendEmail({
      to: owner.email,
      subject: `Your document has been viewed: ${documentName}`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};
