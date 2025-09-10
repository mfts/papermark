import { sendEmail } from "@/lib/resend";

import DataRoomsInformationEmail from "@/components/emails/data-rooms-information";

import { CreateUserEmailProps } from "../types";

const USECASE_SUBJECTS = {
  "mergers-and-acquisitions": "Virtual Data Rooms for Mergers and Acquisitions",
  "startup-fundraising": "Virtual Data Rooms for Startup Fundraising",
  "fund-management": "Virtual Data Rooms for Fund Management & Fundraising",
  sales: "Virtual Data Rooms for Sales",
  "project-management": "Virtual Data Rooms for Project Management",
  operations: "Virtual Data Rooms for Operations",
  other: "Virtual Data Rooms",
};

export const sendDataroomInfoEmail = async (
  params: CreateUserEmailProps,
  useCase: string,
) => {
  const { email } = params.user;

  const emailTemplate = DataRoomsInformationEmail();

  const subject = USECASE_SUBJECTS[useCase as keyof typeof USECASE_SUBJECTS];

  try {
    await sendEmail({
      to: email as string,
      subject,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
