import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { sendInvitationToViewDocument } from "@/lib/emails/send-invitation-to-view-document";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // POST /api/emails/invite-recipient
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    // Assuming data is an object with `name` and `description` properties
    const { recipientEmails, documentLink } = req.body;
    var { senderEmail } = req.body;

    try {
      await identifyUser((session.user as CustomUser).id);
      const promises = recipientEmails.map(async (email: string) => {
        const emailResponse = await sendInvitationToViewDocument(email, documentLink, senderEmail, session.user?.name);
        return emailResponse;
      });

      const responses = await Promise.all(promises);

      // type already create, if tracking is needed, uncomment the code below
      // await trackAnalytics({
      //   event: "Invitation To View Document",
      //   email: session.user?.email,
      //   url: documentLink xqs1,
      // });

      const hasErrors = responses.some((emailResponse: any) => emailResponse.statusCode)
      if (hasErrors) {
        res.status(500).json({ error: "Internal Server Error: Some or all invites were not send please try again" });
      }
      res.status(201).json({ message: "Successfuly emailed invitations" });
    } catch (error) {
      log(`Failed to send invitation email. Error: \n\n ${error}`)
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}