import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { analytics, trackAnalytics } from "@/lib/analytics";
import { sendViewedDataroomEmail } from "@/lib/emails/send-viewed-dataroom";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }
  // POST /api/datarooms/views
  const { dataroomId, ...data } = req.body;

  const { email, password } = data as { email: string; password: string };

  // Fetch the dataroom to verify the settings
  const dataroom = await prisma.dataroom.findUnique({
    where: {
      id: dataroomId,
    },
    select: {
      emailProtected: true,
      password: true,
    },
  });

  if (!dataroom) {
    res.status(404).json({ message: "Dataroom not found." });
    return;
  }

  // Check if email is required for visiting the dataroom
  if (dataroom.emailProtected) {
    if (!email || email.trim() === "") {
      res.status(400).json({ message: "Email is required." });
      return;
    }

    // You can implement more thorough email validation if required
  }

  //Password validation in email-authcode.ts

  try {
    const newDataroomView = await prisma.dataroomView.create({
      data: {
        dataroomId: dataroomId,
        viewerEmail: email,
      },
      include: {
        dataroom: {
          select: {
            owner: true,
            name: true,
          },
        },
      },
    });

    // TODO: cannot identify user because session is not available
    // await identifyUser((session.user as CustomUser).id);
    // await analytics.identify();

    await trackAnalytics({
      event: "Dataroom Viewed",
      viewerId: newDataroomView.id,
      viewerEmail: email,
    });

    // TODO: this can be offloaded to a background job in the future to save some time
    // send email to document owner that document has been viewed
    await sendViewedDataroomEmail(
      newDataroomView.dataroom.owner.email as string,
      dataroomId,
      newDataroomView.dataroom.name,
      email,
    );

    return res.status(200).json({
      message: "Dataroom View recorded",
      viewId: newDataroomView.id,
    });
  } catch (error) {
    log(`Failed to record view for ${dataroomId}. Error: \n\n ${error}`);
    return res.status(500).json({ message: (error as Error).message });
  }
}
